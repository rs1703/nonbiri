import React, { useEffect, useState } from "react";
import { Task } from "../constants";
import "../styles/UpdateProgress.less";
import websocket from "../websocket";

const UpdateProgress = () => {
  const [updateState, setUpdateState] = useState<LibraryUpdateState>();

  useEffect(() => {
    const pushUpdateState = ({ body }: IncomingMessage<LibraryUpdateState>) => {
      setUpdateState(body);
    };

    const removers = [
      websocket.Handle(Task.UpdateLibrary, pushUpdateState),
      websocket.Handle(Task.GetUpdateLibraryState, pushUpdateState)
    ];

    return () => {
      removers.forEach(remove => remove());
    };
  }, []);

  if (!updateState?.current) {
    return null;
  }

  return (
    <div styleName="updater">
      <span style={{ width: `${(updateState.progress / updateState.total) * 100}%` }} />
      <strong>
        Updating ({updateState.progress}/{updateState.total}): {updateState.current}
      </strong>
    </div>
  );
};

export default UpdateProgress;
