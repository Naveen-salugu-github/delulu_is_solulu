import React from 'react';
import { Text, TextProps } from 'react-native';

type Props = TextProps & {
  text: string;
  speedMs?: number;
  startDelayMs?: number;
  onDone?: () => void;
};

function extraDelayForChar(ch: string) {
  if (ch === '.' || ch === '!' || ch === '?') return 180;
  if (ch === ',' || ch === ';' || ch === ':') return 80;
  if (ch === '\n') return 120;
  return 0;
}

export function TypewriterText({
  text,
  speedMs = 22,
  startDelayMs = 0,
  onDone,
  ...rest
}: Props) {
  const [shown, setShown] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;
    setShown('');

    const run = async () => {
      if (startDelayMs > 0) {
        await new Promise((r) => setTimeout(r, startDelayMs));
      }
      for (let i = 0; i < text.length; i += 1) {
        if (cancelled) return;
        const next = text.slice(0, i + 1);
        setShown(next);
        const ch = text[i] ?? '';
        const delay = speedMs + extraDelayForChar(ch);
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, delay));
      }
      if (!cancelled) onDone?.();
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [text, speedMs, startDelayMs, onDone]);

  return (
    <Text {...rest}>
      {shown}
    </Text>
  );
}

