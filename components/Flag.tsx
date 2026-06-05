import React from 'react';

interface FlagProps {
  country: 'gb' | 'de';
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

export default function Flag({ country, size = 20, className, style }: FlagProps) {
  return (
    <img
      src={`https://flagcdn.com/${country}.svg`}
      alt={`${country} flag`}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        borderRadius: '2px',
        width: `${size}px`,
        height: 'auto',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        ...style
      }}
      className={className}
      loading="lazy"
    />
  );
}
