package mangadex

type (
	Manga struct {
		ID         string
		Type       string
		Attributes mAttrs

		Relationships []Relationship
	}

	mAttrs struct {
		Title       any
		Description any

		Tags  []Tag
		Links any

		OriginalLanguage       string
		PublicationDemographic string
		ContentRating          string
		Status                 string

		CreatedAt string
		UpdatedAt string
	}

	Chapter struct {
		ID         string
		Attributes struct {
			Title              string
			Volume             string
			Chapter            string
			TranslatedLanguage string

			ExternalURL string
			Hash        string
			Data        []string
			DataSaver   []string

			CreatedAt string
			PublishAt string
			UpdatedAt string
		}
		Relationships []Relationship
	}

	Relationship struct {
		ID         string
		Type       string
		Related    string
		Attributes any
	}

	rAttributes struct {
		Name        string
		Description string
		Website     string
		IRCServer   string
		IRCChannel  string
		Discord     string
		Email       string `json:"contactEmail"`

		Volume    string
		FileName  string
		CreatedAt string
		UpdatedAt string
	}

	Tag struct {
		ID         string
		Type       string
		Attributes struct {
			Name  any
			Group string
		}
	}
)
