/** @jsxImportSource react */

type Props = {
  className: string;
}

export default function Logo({ className }: Props) {  
  return <img id="logo" className={className} src={'/electrodb-drk-compressed.png'} alt="logo" />;
}