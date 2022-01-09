package websocket

import (
	"log"
	"sync"
	"time"

	"nonbiri/utils"

	. "nonbiri/constants"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"github.com/rs1703/logger"
)

type Connection struct {
	*websocket.Conn
	Send chan *OutgoingMessage
}

type IncomingMessage struct {
	Identifier int  `json:"identifier"`
	Task       Task `json:"task"`
	Body       any  `json:"body,omitempty"`
}

type OutgoingMessage struct {
	Identifier int    `json:"identifier,omitempty"`
	Task       Task   `json:"task"`
	Body       any    `json:"body,omitempty"`
	Error      string `json:"error,omitempty"`
}

type TaskHandler func(message *IncomingMessage) (any, error)

const (
	writeWait  = 10 * time.Second
	pongWait   = 60 * time.Second
	pingPeriod = (pongWait * 9) / 10
)

var (
	Connections = make(map[*Connection]bool)
	Broadcast   = make(chan *OutgoingMessage)
	Register    = make(chan *Connection)
	Unregister  = make(chan *Connection)
)

var upgrader = websocket.Upgrader{ReadBufferSize: 1024, WriteBufferSize: 1024}

var (
	taskHandlers = make(map[Task]TaskHandler)
	mutex        = sync.Mutex{}
)

func init() {
	go func() {
		for {
			select {
			case conn := <-Register:
				Connections[conn] = true
			case conn := <-Unregister:
				if _, exists := Connections[conn]; exists {
					delete(Connections, conn)
					close(conn.Send)
				}
			case message := <-Broadcast:
				for conn, ok := range Connections {
					if ok {
						conn.Send <- message
					}
				}
			}
		}
	}()
}

func Serve(c *gin.Context) {
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		logger.Err.Println(err)
		return
	}

	connection := &Connection{Conn: conn, Send: make(chan *OutgoingMessage)}
	Register <- connection

	go connection.handleIncomingMessage()
	go connection.handleOutgoingMessage()
}

func Handle(task Task, handler TaskHandler) {
	mutex.Lock()
	defer mutex.Unlock()
	taskHandlers[task] = handler
}

func (self *Connection) handleIncomingMessage() {
	defer func() {
		Unregister <- self
		_ = self.Close()
	}()

	_ = self.SetReadDeadline(time.Now().Add(pongWait))
	self.SetPongHandler(func(string) error {
		return self.SetReadDeadline(time.Now().Add(pongWait))
	})

	for {
		_, buf, err := self.ReadMessage()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
				logger.Err.Println(err)
			}
			break
		}

		go func(buf []byte) {
			message := &IncomingMessage{}
			if err := utils.Unmarshal(buf, message); err != nil {
				log.Println(err)
				return
			}

			mutex.Lock()
			handler, exists := taskHandlers[message.Task]
			mutex.Unlock()

			if exists {
				res, err := handler(message)

				if res != nil || err != nil {
					reply := &OutgoingMessage{Identifier: message.Identifier, Task: message.Task, Body: res}
					if err != nil {
						logger.Err.Println(message.Task, err)
						reply.Error = err.Error()
					}

					switch message.Task {
					case Tasks.UpdateManga, Tasks.FollowManga, Tasks.UnfollowManga,
						Tasks.UpdateChapter, Tasks.UpdateChapters, Tasks.ReadPage,
						Tasks.ReadChapter, Tasks.UnreadChapter, Tasks.UpdateReaderPreference:
						Broadcast <- reply
						break
					default:
						if _, exists := Connections[self]; exists {
							self.Send <- reply
						}
						break
					}
				}
			} else {
				logger.Err.Println("Unhandled task:", message.Task)
			}
		}(buf)
	}
}

func (self *Connection) handleOutgoingMessage() {
	ticker := time.NewTicker(pingPeriod)
	defer func() {
		ticker.Stop()
		_ = self.Close()
	}()

	for {
		select {
		case message, ok := <-self.Send:
			if _ = self.SetWriteDeadline(time.Now().Add(writeWait)); ok {
				if buf, err := utils.Marshal(message); err == nil {
					_ = self.WriteMessage(websocket.TextMessage, buf)
				} else {
					_ = self.WriteMessage(websocket.TextMessage, []byte(err.Error()))
				}
			} else {
				_ = self.WriteMessage(websocket.CloseMessage, nil)
			}
		case <-ticker.C:
			_ = self.SetWriteDeadline(time.Now().Add(writeWait))
			if err := self.WriteMessage(websocket.PingMessage, nil); err != nil {
				return
			}
		}
	}
}
