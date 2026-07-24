import type { PropsWithChildren } from "react";
import "./Row.css";

export const CenteredRow = ({ children }: PropsWithChildren) => {
  return <div className="row-centered">{children}</div>;
};
