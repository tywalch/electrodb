/** @jsxImportSource react */
import type { FunctionComponent } from "react";
import "./LinkButton.css";

type Props = {
  href: string;
  text: string;
  alt?: boolean;
};

const LinkButton: FunctionComponent<Props> = ({ href, text, alt }) => {
  return (
    <a className={`link-button${alt ? " alt" : ""}`} href={href}>
      {text}
    </a>
  );
};

export default LinkButton;
