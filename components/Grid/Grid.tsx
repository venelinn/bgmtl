import clsx from 'clsx';
import React, {
  forwardRef,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from 'react';
import styles from './Grid.module.scss';

export type RowProps = {
  className?: string;
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
  customCols?: string;
  children: ReactElement<CellProps> | ReactElement<CellProps>[];
  gap?: boolean;
  minWidth?: string;
};

export type CellProps = {
  className?: string;
  children: ReactNode;
  cellNormal?: boolean;
  asCard?: boolean;
  span?: 1 | 2 | 3 | 4 | 5 | 6;
  onMouseEnter?: React.MouseEventHandler<HTMLDivElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLDivElement>;
};

const Row = forwardRef<HTMLDivElement, RowProps>(
  (
    {
      className,
      cols = 1,
      minWidth,
      customCols,
      children,
      gap = true,
      ...props
    },
    ref,
  ) => {
    const dynamicClassName = customCols || styles[`grid--${cols}`];
    const inlineStyles = {
      ...(cols && { '--_grid-cols': cols }),
      ...(minWidth && { '--_min-column-width': minWidth }),
    } as React.CSSProperties;
    return (
      <div
        data-cols={customCols || cols}
        className={clsx(styles.grid, dynamicClassName, className, {
          [styles['grid__no-gap']]: !gap,
        })}
        ref={ref}
        style={inlineStyles}
        {...props}
      >
        {React.Children.toArray(children).map(child => {
          if (!isValidElement(child) || child.type !== Cell) {
            throw new Error('Children of <Row> must be of type Cell');
          }
          return child;
        })}
      </div>
    );
  },
);

Row.displayName = 'Row';

const Cell = ({
  className,
  children,
  cellNormal = false,
  asCard = false,
  span,
  ...props
}: CellProps) => {
  const inlineStyles = {
    ...(span && { '--_span': span }),
  } as React.CSSProperties;
  return (
    <div
      className={clsx(styles.grid__item, className, {
        [styles.card]: asCard,
        [styles.normal]: cellNormal && !asCard,
      })}
      style={inlineStyles}
      {...props}
    >
      {children}
    </div>
  );
};

Cell.displayName = 'Cell';

export { Row, Cell };
