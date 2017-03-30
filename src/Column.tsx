import * as React from 'react';
import strEnum from './utils/strEnum';

export const SortDirection = strEnum([
  'asc',
  'desc'
]);
export type SortDirection = keyof typeof SortDirection;

export type Column = {
  field?: string;
  cell?: (data: any) => JSX.Element
  header?: JSX.Element|string;
  filterControl?: JSX.Element|string;
  width?: number|string;
  sortable?: boolean;
  filterable?: boolean;
  sortDirection?: SortDirection;
  filter?: any;
  hidden?: boolean;
};

export class ColumnDefinition extends React.Component<Column, {}> {

  public static propTypes = {
    field: React.PropTypes.string,
    header: React.PropTypes.any,
    cell: React.PropTypes.any,
    width: React.PropTypes.oneOfType([
      React.PropTypes.string,
      React.PropTypes.number
    ]),
    sortable: React.PropTypes.bool,
    filterable: React.PropTypes.bool,
    sortDirection: React.PropTypes.string,
    filter: React.PropTypes.any,
    hidden: React.PropTypes.bool
  };

  public static defaultProps = {
    sortable: false,
    filterable: false
  };

  constructor(props, context) {
    super(props, context);
  }

  public render() {
    return null;
  }
}
