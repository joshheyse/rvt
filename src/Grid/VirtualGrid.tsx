import * as React from 'react';
import GridRow, { VirtualGridMouseEventHandler, RowData } from './GridRow';
import GridHeader from './GridHeader';
import List, { ListProps, ListViewProps } from '../List';
import VirtualTable, { VirtualTableBaseProps } from '../VirtualTable';


type VirtualGridProps = {
  getRow: (rowIndex: number) => RowData;
  onMouseDown?: VirtualGridMouseEventHandler;
  onClick?: VirtualGridMouseEventHandler;
  pinnedRows?: RowData[];
};

class VirtualGrid extends React.Component<VirtualTableBaseProps & ListViewProps & VirtualGridProps, {}> {

  public render() {
    const {
      fieldSet,
      onSortSelection,
      onFilterChanged,
      onWidthChanged,
      onMove,
      onHiddenChange,
      onMouseDown,
      onClick,
      pinnedRows,
      ...rest
    } = this.props;

    const fields = fieldSet.getFields();
    const row =
      <GridRow
        fields={fields}
        onMouseDown={onMouseDown}
        onClick={onClick}
      />;


    const header =
      <GridHeader
        fieldSet={fieldSet}
        onSortSelection={onSortSelection}
        onFilterChanged={onFilterChanged}
        onWidthChanged={onWidthChanged}
        onMove={onMove}
        onHiddenChange={onHiddenChange}
        pinnedRows={pinnedRows}
        gridRow={row}
      />;

    return (
      <VirtualTable
        {...rest}
        header={header}
        row={row}
      />
    );
  }
}

export default List(VirtualGrid) as React.ComponentClass<VirtualTableBaseProps & ListProps & VirtualGridProps>;
