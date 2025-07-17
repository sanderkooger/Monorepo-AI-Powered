import { type JSX } from "react";

const Code = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}): JSX.Element => <code className={className}>{children}</code>;

export default Code;