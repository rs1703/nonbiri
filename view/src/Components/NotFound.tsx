import React from "react";
import "../styles/NotFound.less";

interface NotFoundProps {
  message?: string;
}

const NotFound = ({ children, title, ...props }: NotFoundProps & Props<HTMLDivElement>) => (
  <div {...props} styleName="notFound">
    <strong styleName="status">{title || "404 Not Found"}</strong>
    {children}
  </div>
);

export default NotFound;
