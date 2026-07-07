import type { PropsWithChildren } from "react";
import "./QuickLook.css";

const QuickLook = ({ children }: PropsWithChildren) => {
  return <div className="parent">{children}</div>;
};

export default QuickLook;
