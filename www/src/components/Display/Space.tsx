import react from 'react';

type Props = {
  width: number;
}

export const Spacer = ({ width }: Props) => {
  return (
    <div style={{ width: `${width}em` }} />
  )
}