import react from "react";
import type { FunctionComponent } from "react";
import "./Row.css";

export const CenteredRow: FunctionComponent = ({ children }) => {
  return <div className="row-centered">{children}</div>;
};
