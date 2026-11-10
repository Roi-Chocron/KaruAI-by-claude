import { Fragment } from 'react';

export type Marked = { before: string; marked: string; after: string };

// A headline with one phrase on the lime marker; "\n" in the text starts a new line
export function MarkedText({ text }: { text: Marked }) {
  const lines = (value: string) =>
    value.split('\n').map((line, i) => (
      <Fragment key={i}>
        {i > 0 && <br />}
        {line}
      </Fragment>
    ));
  return (
    <>
      {lines(text.before)}
      <span className="marker whitespace-nowrap">{text.marked}</span>
      {lines(text.after)}
    </>
  );
}
