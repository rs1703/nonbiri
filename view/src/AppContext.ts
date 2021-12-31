import { createContext } from "react";

const AppContext = createContext<{
  context: AppContext;
  setContext: Dispatcher<AppContext>;
}>(undefined);
export default AppContext;
