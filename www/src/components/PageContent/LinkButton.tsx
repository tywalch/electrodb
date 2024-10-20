import react from "react";
import type { FunctionComponent } from "react";
import "./LinkButton.css";

const ButtonTypeStyle = {
  default: { backgroundColor: "white", textColor: "black" },
} as const;

type Props = {
  href: string;
  text: string;
  alt?: boolean;
};

const LinkButton: FunctionComponent<Props> = ({ href, text, alt }) => {
  const style = alt ? { backgroundColor: "#f9bd00" } : {};
  return (
    <a className="link-button" href={href} style={style}>
      {text}
    </a>
  );
};

export default LinkButton;
