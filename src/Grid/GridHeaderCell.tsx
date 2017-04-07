import * as React from 'react';
import Filter from '../Filter';
import { Field, SortDirection } from '../List/Field';
import { FieldSet } from '../List/FieldSet';
import ColumnChooserButton from './ColumnChooserButton';
import safeMouseMove from '../utils/saveMouseMove';

export type GridHeaderCellProps = {
  field: Field;
  fieldSet: FieldSet;
  rowSpan?: number;
  colSpan?: number;
  canResize?: boolean;
  columnChooser?: any;
  onSortSelection?: (sortDirection: SortDirection, field: Field) => void;
  onFilterChanged?: (filter: any, field: Field) => void;
  onWidthChanged?: (width: number, field: Field) => void;
  onMouseDown(e: React.MouseEvent<HTMLTableHeaderCellElement>);
};

export default class GridHeaderCell extends React.Component<GridHeaderCellProps, {}> {

  public static defaultProps = {
    canResize: true
  };

  public static propTypes = {
    field: React.PropTypes.any,
    fieldSet: React.PropTypes.any,
    rowSpan: React.PropTypes.number,
    onSortSelection: React.PropTypes.func,
    onWidthChanged: React.PropTypes.func,
    onFilterChanged: React.PropTypes.func
  };

  private onResizeHandleMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if(e.button !== 0) {
      return;
    }
    e.stopPropagation();

    const { onWidthChanged } = this.props;

    if(!onWidthChanged) {
      return;
    }

    let startingWidth;
    if(typeof this.props.field.width === 'number') {
      startingWidth = this.props.field.width;
    }
    else {
      startingWidth = e.currentTarget.closest('th').clientWidth;
    }

    let startingX = e.pageX;
    safeMouseMove<HTMLDivElement>(e,
      moveEvent => onWidthChanged(startingWidth + (moveEvent.pageX - startingX), this.props.field)
    );
  }

  private onSortClick(sortDirection: SortDirection, e: React.MouseEvent<HTMLDivElement>) {
    e.stopPropagation();
    const { onSortSelection, field } = this.props;
    if(onSortSelection) {
      onSortSelection(sortDirection, field);
    }
  }

  private sortBtn(sortDirection: SortDirection): React.ReactElement<any> {
    const { field } = this.props;
    const classNames = [
      'sort',
      `sort-${sortDirection}`,
      field.sortDirection === sortDirection ? 'sort-active' : 'sort-inactive'
    ].join(' ');

    return <button
      onClick={this.onSortClick.bind(this, sortDirection)}
      className={classNames}
    />;
  }

  public render() {
    const {
      fieldSet,
      field,
      field: {
        name,
        header,
        width,
        sortDirection,
        sortable,
        filterable,
        filter
      },
      columnChooser,
      canResize,
      rowSpan,
      colSpan,
      onSortSelection,
      onFilterChanged,
      onMouseDown
    } = this.props as any;

    const sortSelectionHandler = d => onSortSelection ? onSortSelection(d, field) : null;
    const filterChangedHandler = f => onFilterChanged ? onFilterChanged(f, field) : null;

    const headerClassName = [
      'grid-header-cell',
      sortable ? 'sortable' : null,
      sortable && sortDirection ? `sorted sorted-${name.sortDirection}` : null,
      filterable ? 'filterable' : null,
      filterable && filter ? 'filtered' : null
    ].join(' ');
    let sortFilterControl;
    if(filterable) {
      sortFilterControl = <Filter field={field} onSortSelection={sortSelectionHandler} onFilterChanged={filterChangedHandler} />;
    }
    else if(sortable) {
      sortFilterControl = (
        <div>
          {this.sortBtn(SortDirection.asc)}
          {this.sortBtn(SortDirection.desc)}
        </div>
      );
    }
    const dataSet = {'data-group': fieldSet.name, 'data-field': name};
    return (
      <th key={name} style={{width, padding: 0}} rowSpan={rowSpan} colSpan={colSpan} {...dataSet}>
        <div className={`${headerClassName}`}>
          <div className='header' onMouseDown={onMouseDown}>
            {header || name}
          </div>
          <div className='sort-filter'>
            {sortFilterControl}
          </div>
          {canResize && <div className='resize-handle' onMouseDown={this.onResizeHandleMouseDown.bind(this)} />}
          {columnChooser && <div className='column-chooser'><ColumnChooserButton columnChooser={columnChooser} /></div>}
        </div>
      </th>
    );
  }
}
