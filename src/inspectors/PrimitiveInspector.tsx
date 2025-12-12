import React from 'react';

export const PrimitiveInspector = ({ value }: { value: any }) => {
  if (value === null) {
    return <span>null</span>;
  }
  if (value === undefined) {
    return <span>undefined</span>;
  }
  return <span>{value.toString()}</span>;
};
