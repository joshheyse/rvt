import * as React from 'react';
import { createPortal } from 'react-dom';
import * as PropTypes from 'prop-types';
import { autobind } from 'core-decorators';
import { isEqual, flatten, every, debounce } from 'lodash';

import { Field, FieldBase } from '../List/Field';
import { FieldSet, isVisible } from '../List/FieldSet';
import { ListViewProps } from '../List';
import GridHeaderCell from './GridHeaderCell';
import ColumnChooser from './ColumnChooser';
import ColumnChooserButton from './ColumnChooserButton';
import safeMouseMove from '../utils/saveMouseMove';
import { GridRowProps, GridRowComponentProps, GridRowHeaderProps, GridSecondaryHeaderProps } from './types';
import { renderGridRowHeader} from './helpers';

const hoverClassName = 'field-moving-hover';
const movingClassName = 'field-moving';

export type FieldHeader = {
  field: FieldBase;
  rowSpan: number;
  colSpan: number;
};

export function fillLevels(fieldSet: FieldSet, rows: number): FieldHeader[][] {
  const level: FieldHeader[] = [];
  const levels = [level];
  for(let child of fieldSet.children.filter(f => isVisible(f))) {
    if(child instanceof FieldSet) {
      level.push({field: child, colSpan: child.getFieldCount(), rowSpan: 1});
      let subLevels = fillLevels(child, rows - 1);
      for(let i = 0; i < subLevels.length; i++) {
        if(subLevels[i] && subLevels[i].length > 0) {
          levels[i + 1] = (levels[i + 1] || []).concat(subLevels[i]);
        }
      }
    }
    else if(child instanceof Field) {
      level.push({field: child, colSpan: 1, rowSpan: Math.max(rows, 1)});
    }
  }
  return levels;
}

export function getLevels(fieldSet: FieldSet): FieldHeader[][] {
  const maxRows = fieldSet.getLevelCount();
  return fillLevels(fieldSet, maxRows);
}

export type GridHeaderProps<TData extends object> = ListViewProps & {
  pinnedRows?: GridRowProps<TData>[];
  gridRow?: React.ComponentType<GridRowComponentProps<TData>>|React.ReactElement<GridRowComponentProps<TData>>;
  rowHeader?: React.ComponentType<GridRowHeaderProps<TData>>;
  secondaryHeader?: React.ComponentType<GridSecondaryHeaderProps>;
  chooserMountPoint?: HTMLElement
  hideDefaultChooser?: boolean;
  fixedColumnWidth?: boolean;
  hideFilters?: boolean;
  hideHeader?: boolean;
  onAllHeaderWidthsSet?: () => void;
};

export default class GridHeader<TData extends object> extends React.Component<GridHeaderProps<TData>, {
  showColumnChooser: boolean;
  draggingColumn: boolean;
}> {

  public static propTypes = {
    fieldSet: PropTypes.any.isRequired,
    onSortSelection: PropTypes.func,
    onFilterChanged: PropTypes.func,
    onWidthChanged: PropTypes.func,
    onMove: PropTypes.func,
    onHiddenChange: PropTypes.func,
    chooserMountPoint: PropTypes.any,
    hideDefaultChooser: PropTypes.bool,
    hideHeader: PropTypes.bool
  };

  private theadRef: HTMLDivElement;
  private debouncedUpdateWidthsAfterChange: () => void;
  private headerCells: Map<string, Field> = new Map();
  public static defaultProps = {
    onAllHeaderWidthsSet: () => {},
    hideHeader: false
  };

  constructor(props: GridHeaderProps<TData>, context) {
    super(props, context);
    this.state = {
      showColumnChooser: false,
      draggingColumn: false
    };

    this.debouncedUpdateWidthsAfterChange = debounce(this.updateWidthsAfterChange, 200, {leading: false, trailing: true});
  }

  public shouldComponentUpdate(nextProps: GridHeaderProps<TData>, nextState) {
    return !(isEqual(this.props, nextProps) && isEqual(this.state, nextState));
  }

  @autobind
  private onFieldMouseDown(e: React.MouseEvent<HTMLTableHeaderCellElement>) {
    const { onMove } = this.props;
    const rootFieldSet = this.props.fieldSet;

    this.setState({draggingColumn: true});

    e.persist();
    const target = e.currentTarget;
    const tr = e.currentTarget.closest('tr') as HTMLTableRowElement;
    const th = target.closest('th') as HTMLTableHeaderCellElement;
    const group = th.dataset['group'];
    const fieldName = th.dataset['field'];

    const field = rootFieldSet.findFieldByName(fieldName);

    tr.classList.add(movingClassName);
    let currentHover: HTMLTableHeaderCellElement;

    safeMouseMove<HTMLTableHeaderCellElement>(e,
      (moveEvent) => {
        const over = (moveEvent.target as any).closest(`th[data-group="${group}"]`) as HTMLTableHeaderCellElement;
        if(currentHover && over !== currentHover) {
          currentHover.classList.remove(hoverClassName);
        }
        if(over && over !== target) {
          over.classList.add(hoverClassName);
          currentHover = over;
        }
      },
      () => {
        this.setState({draggingColumn: false});
        if(onMove) {
          tr.classList.remove(movingClassName);
          if(currentHover) {
            currentHover.classList.remove(hoverClassName);
            const hoverFieldName = currentHover.dataset['field'];
            const hoverField = rootFieldSet.findFieldByName(hoverFieldName);
            const parentFieldSet = rootFieldSet.findParent(hoverField);
            onMove(parentFieldSet.findFieldIndex(hoverField) , field);
          }
        }
      }
    );
  }

  @autobind
  private onToggleColumnChooserVisibility(showColumnChooser: boolean) {
    this.setState({showColumnChooser});
  }

  private renderHeaderRow(rowCount: number, colCount: number, rowIndex: number, fieldHeader: FieldHeader, colIndex: number, fieldHeadersOnRow: FieldHeader[]) {
    const { field, colSpan, rowSpan } = fieldHeader;
    const { fieldSet, onSortSelection, onFilterChanged, onTitleChanged, fixedColumnWidth, hideFilters } = this.props;
    const isFirstRow = rowIndex === 0;
    const isLastRow = ((rowIndex + rowSpan) === rowCount);

    let colSum = 0;
    for(let i = 0; i <= colIndex; i++) {
      colSum += fieldHeadersOnRow[i].colSpan;
    }
    let isLastCol = colSum === colCount;

    // place ColumnChooser in the last column of the first row
    const columnChooserButton = isFirstRow && isLastCol
      ? this.renderColumnChooserButton()
      : null;
    this.headerCells.set(field.name, field);
    return (
      <GridHeaderCell
        key={field.name}
        field={field}
        fieldSet={fieldSet.findParent(field)}
        colSpan={colSpan}
        rowSpan={rowSpan}
        onSortSelection={onSortSelection}
        onFilterChanged={onFilterChanged}
        onWidthChanged={this.onWidthChangedProxy}
        onTitleChanged={onTitleChanged}
        onMouseDown={this.onFieldMouseDown}
        canResize={fixedColumnWidth || (isLastRow && !isLastCol)}
        columnChooserButton={columnChooserButton}
        hideFilters={hideFilters}
      />
    );
  }

  @autobind
  private onWidthChangedProxy(width: number, field: FieldSet | Field) {
    console.log(width, field.name)
    this.props.onWidthChanged(width, field);
    this.debouncedUpdateWidthsAfterChange();
  }

  @autobind
  private updateWidthsAfterChange() {
    const ths = [...this.theadRef.querySelectorAll('th')];
    console.log('updating all widths');
    const updates: [number, Field][] = [];
    ths.forEach((th) => {
      const fieldName = th.getAttribute('data-field');
      const field = this.headerCells.get(fieldName);
      if(field instanceof Field) {
        const width = th.clientWidth;
        updates.push([width, field]);
        console.log([width, fieldName, field])
      }
    });

    this.props.onWidthChangedBulk(updates);
  }
  @autobind
  private setRef(ref) {
    this.theadRef = ref;
  }

  private renderColumnChooserButton(): any {
    const {
      props: {
        fieldSet,
        onHiddenChange,
        chooserMountPoint,
        hideDefaultChooser
      },
      state: {
        showColumnChooser
      }
    } = this;

    const columnChooser = (
      <ColumnChooser
        fieldSet={fieldSet}
        onHiddenChange={onHiddenChange}
        onToggleVisibility={this.onToggleColumnChooserVisibility}
      />
    );

    if(chooserMountPoint) {
      return createPortal(columnChooser, chooserMountPoint);
    } else if(!hideDefaultChooser) {
      return (
        <ColumnChooserButton
          columnChooser={columnChooser}
          onToggleVisibility={this.onToggleColumnChooserVisibility}
          showColumnChooser={showColumnChooser}
        />
      );
    }
  }

  public renderPinnedRows() {
    const { pinnedRows, gridRow, secondaryHeader, fieldSet } = this.props;
    let headerRowElements = [];

    if(secondaryHeader) {
      headerRowElements = [
        React.createElement(secondaryHeader, {fields: fieldSet.getFields(), key: 'secondary-header'})
      ];
    }

    if(pinnedRows) {
      const rowElement = React.isValidElement(gridRow) ? gridRow : React.createElement(gridRow as any);
      headerRowElements = [...headerRowElements, ...pinnedRows.map((r, i) => React.cloneElement(rowElement as any, {...r, key: i}))];
    }

    return headerRowElements;
  }

  private allChildrenHaveWidthSet(props) {
    const { fieldSet} = props;
    const rows: FieldBase[] = flatten(getLevels(fieldSet)).map((r) => r.field );
    return every(rows, (r: FieldBase) => r.hidden || r.width);
  }

  public UNSAFE_componentWillReceiveProps(nextProps, props) {
    if (!isEqual(nextProps, props) && this.allChildrenHaveWidthSet(nextProps)) {
      const {onAllHeaderWidthsSet} = this.props;
      onAllHeaderWidthsSet();
    }
  }

  public render() {
    const { fieldSet, rowHeader, hideHeader } = this.props;
    const rows = getLevels(fieldSet);
    const colCount = rows[0].reduce((r, i) => r + i.colSpan, 0);
    const className = [
      this.state.draggingColumn ? 'dragging' : '',
      hideHeader ? 'hidden-header' : ''
    ].join(' ');

    if(flatten(rows).length >= 1) {
      return (
        <thead
          className={className}
          ref={this.setRef}
        >
          {rows.map((row: FieldHeader[], r: number) => {
            return (
              <tr key={r}>
                {r === 0 && renderGridRowHeader(rowHeader, null, rows.length)}
                {row.map((fieldHeader: FieldHeader, idx: number, headers: FieldHeader[]) => (
                  this.renderHeaderRow(rows.length, colCount, r, fieldHeader, idx, headers))
                )}
              </tr>
            );
          })}
          {this.renderPinnedRows()}
        </thead>
      );
    } else {
        return (
          <thead className={className}>
            <tr>
              <th>
                <span style={{float: 'right'}}>
                  {this.renderColumnChooserButton()}
                </span>
              </th>
            </tr>
            {this.renderPinnedRows()}
          </thead>
        );
    }
  }
}
