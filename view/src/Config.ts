export const routes = {
  library: "/",
  browse: "/browse",
  updates: "/updates",
  history: "/history",
  manga: "/view",
  reader: "/read"
};

export default {
  header: {
    links: [
      ["Library", routes.library],
      ["Updates", routes.updates],
      ["History", routes.history],
      ["Browse", routes.browse]
    ]
  },
  library: {
    limit: 36
  },
  browse: {
    limit: 36
  },
  updates: {
    limit: 36
  },
  history: {
    limit: 36
  }
};
