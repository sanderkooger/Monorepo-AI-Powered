import { type JSX } from "react";

const Card = ({
  className,
  title,
  children,
  href,
}: {
  className?: string;
  title: string;
  children: React.ReactNode;
  href: string;
}): JSX.Element => (
  <a
    className={className}
    href={`${href}?utm_source=create-turbo&utm_medium=basic&utm_campaign=create-turbo`}
    rel="noopener noreferrer"
    target="_blank"
  >
    <h2>
      {title} <span>-&gt;</span>
    </h2>
    <p>{children}</p>
  </a>
);

export default Card;
