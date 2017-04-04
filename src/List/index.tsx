import * as React from 'react';
import * as _ from 'lodash';
import { FieldSet, RootFieldSet } from './FieldSet';
import { Field, SortDirection, FieldDefaults, FieldDisplay } from './Field';
import strEnum from '../utils/strEnum';

export type SortState = {fieldName: string, direction: SortDirection}[];
export type FilterState = {[fieldName: string]: any };

export type ListState = {
  sorts?: SortState;
  filters?: FilterState;
  fields?: FieldDisplay;
};

export const ListStateChangeType = strEnum([
  'sorts',
  'filters',
  'fields'
]);
export type ListStateChangeType = keyof typeof ListStateChangeType;

export function isDataChange(changeType: ListStateChangeType) {
  return changeType === ListStateChangeType.sorts || changeType === ListStateChangeType.filters;
}

export type ListProps = {
  onListStateChanged: (newListState: ListState, changeType: ListStateChangeType, fieldName?: string) => void;
  listState?: ListState;
  fieldDefaults?: FieldDefaults;
};

export type ListViewProps = {
  fieldSet: FieldSet,
  onSortSelection?: (sortDirection: SortDirection, field: Field) => void;
  onFilterChanged?: (filter: any, field: Field) => void;
  onWidthChanged?: (width: number, field: Field) => void;
  onMove?: (newIndex: number, field: Field) => void;
};

export type ListViewType = React.ComponentClass<ListViewProps>|React.StatelessComponent<ListViewProps>;

export default function List(View: ListViewType): React.ComponentClass<ListProps> {

  return class ListContainer extends React.Component<ListProps, {
    fieldSet: FieldSet
  }> {

    public static propTypes = {
      onListStateChanged: React.PropTypes.func.isRequired,
      listState: React.PropTypes.any,
      fieldDefaults: React.PropTypes.any
    };

    public static defaultProps = {
      listState: {
        sorts: [],
        filters: {}
      } as ListState
    };

    public static getListState(listState: ListState):  ListState {
      return {...ListContainer.defaultProps, ...listState};
    }

    constructor(props, context) {
      super(props, context);
      this.state = {
        fieldSet: this.createFields(props)
      };
    }

    public componentWillReceiveProps(nextProps: React.Props<ListProps> & ListProps) {
      if(this.props.children !== nextProps.children || this.props.listState.fields !== nextProps.listState.fields) {
        this.setState({
          fieldSet: this.createFields(nextProps)
        });
      }
    }

    private createFields(props: React.Props<ListProps> & ListProps) {
      const { fieldDefaults, children } = props;
      const { sorts, filters, fields } = ListContainer.getListState(props.listState);

      const fieldSet = new FieldSet({name: RootFieldSet, children}, fieldDefaults, fields);
      const allFields = fieldSet.getFields();
      allFields.forEach(c => {
        const sortDirection = _.find(sorts, s => s.fieldName === c.name);
        c.sortDirection = (sortDirection && sortDirection.direction) || c.sortDirection;
        c.filter = _.find(filters, s => s.field === c.name);
      });
      return fieldSet;
    }

    private listStateHelper() {
      const { onListStateChanged } = this.props;
      const listState = ListContainer.getListState(this.props.listState);
      const newListState = {
        sorts: listState.sorts,
        filters: listState.filters,
        fields: listState.fields
      };

      const onListState = (listStateChange: ListStateChangeType, change: any, fieldName: string) => {
        if(!onListStateChanged) {
          return;
        }

        if(listStateChange === ListStateChangeType.filters) {
          newListState.filters = change;
        }
        else if(listStateChange === ListStateChangeType.sorts) {
          newListState.sorts = change;
        }
        else if(listStateChange === ListStateChangeType.fields) {
          newListState.fields = change;
        }

        onListStateChanged(newListState, listStateChange, fieldName);
      };

      const filters = _.cloneDeep(listState.filters);
      const sorts = _.cloneDeep(listState.sorts);
      return { filters, sorts, onListStateChanged: onListState };
    }

    private onSortSelection(direction: SortDirection, field: Field) {
      const { onListStateChanged, sorts } = this.listStateHelper();

      _.remove(sorts, s => s.fieldName === field.name);
      sorts.unshift({fieldName: field.name, direction});
      onListStateChanged(ListStateChangeType.sorts, sorts, field.name);
    }

    private onFilterChanged(filter: any, field: Field) {
      const { onListStateChanged, filters } = this.listStateHelper();

      if(filter === null || filter === undefined) {
        delete filters[field.name];
      }
      else if((typeof filter === 'string' || filter instanceof String) && filter.length === 0) {
        delete filters[field.name];
      }
      else {
        filters[field.name] = filter;
      }

      onListStateChanged(ListStateChangeType.filters, filters, field.name);
    }

    private onWidthChanged(width: number, field: Field) {
      const { onListStateChanged } = this.listStateHelper();
      const { fieldSet } = this.state;
      field.resize(width);
      onListStateChanged(ListStateChangeType.fields, fieldSet.getFieldDisplay(), field.name);
    }

    private onMove(newIndex: number, field: Field) {
      const { onListStateChanged } = this.listStateHelper();
      const { fieldSet } = this.state;
      fieldSet.moveField(newIndex, field);
      onListStateChanged(ListStateChangeType.fields, fieldSet.getFieldDisplay(), field.name);
    }

    public render() {
      const { fieldSet } = this.state;

      const props = {
        fieldSet,
        onSortSelection: this.onSortSelection.bind(this),
        onFilterChanged: this.onFilterChanged.bind(this),
        onWidthChanged: this.onWidthChanged.bind(this),
        onMove: this.onMove.bind(this)
      };

      return (
        <View
          {...this.props}
          {...props}
        />
      );
    }
  };
}

