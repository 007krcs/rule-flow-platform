/**
 * AG-Grid Adapter (React/Angular/Vue)
 * 
 * AG-Grid is framework-agnostic, so this adapter works with all three frameworks
 * Supports advanced features like grouping, pivoting, server-side operations
 */

import { BaseUIAdapter, UISchema, RenderContext } from '../core/adapter-system';

export class AGGridAdapter extends BaseUIAdapter {
  getLibraryName(): string {
    return 'ag-grid';
  }

  canHandle(schema: UISchema): boolean {
    return schema.type === 'table' && (
      schema.library === 'ag-grid' ||
      schema.config?.features?.includes('advanced-grid')
    );
  }

  render(schema: UISchema, context?: RenderContext): any {
    const config = this.getResponsiveConfig(schema, context?.device);
    const a11yAttrs = this.buildA11yAttrs(schema);

    // AG-Grid configuration
    const gridOptions = {
      // Basic configuration
      rowData: config?.rowData || [],
      columnDefs: this.buildColumnDefs(config?.columns || []),
      
      // Accessibility (AG-Grid has built-in WCAG support)
      enableCellTextSelection: true,
      ensureDomOrder: true,
      suppressMenuHide: false,
      
      // Responsive
      domLayout: context?.device === 'mobile' ? 'autoHeight' : 'normal',
      
      // Features based on configuration
      pagination: config?.pagination !== false,
      paginationPageSize: config?.pageSize || 10,
      paginationPageSizeSelector: config?.pageSizeOptions || [10, 25, 50, 100],
      
      // Sorting
      sortable: config?.sortable !== false,
      
      // Filtering
      filter: config?.filter !== false,
      floatingFilter: config?.floatingFilter === true,
      
      // Row selection
      rowSelection: config?.rowSelection || 'single',
      checkboxSelection: config?.checkboxSelection === true,
      
      // Grouping
      rowGroupPanelShow: config?.grouping ? 'always' : 'never',
      
      // Pivoting
      pivotMode: config?.pivotMode === true,
      
      // Cell editing
      editable: config?.editable === true,
      
      // Server-side operations
      rowModelType: config?.serverSide ? 'serverSide' : 'clientSide',
      
      // Theming
      theme: config?.theme || 'ag-theme-alpine',
      
      // Events
      onCellValueChanged: (params: any) => {
        if (context?.onChange) {
          context.onChange(`${schema.id}.${params.rowIndex}.${params.column.colId}`, params.newValue);
        }
      },
      
      onSelectionChanged: (params: any) => {
        if (context?.onEvent) {
          const selectedRows = params.api.getSelectedRows();
          context.onEvent('selectionChanged', { rows: selectedRows });
        }
      },
      
      onRowClicked: (params: any) => {
        if (context?.onEvent) {
          context.onEvent('rowClicked', { row: params.data });
        }
      },
      
      // Additional custom config
      ...config?.gridOptions
    };

    // Framework-specific rendering
    switch (context?.framework) {
      case 'react':
        return this.renderReact(schema, gridOptions, a11yAttrs);
      
      case 'angular':
        return this.renderAngular(schema, gridOptions, a11yAttrs);
      
      case 'vue':
        return this.renderVue(schema, gridOptions, a11yAttrs);
      
      default:
        return this.renderReact(schema, gridOptions, a11yAttrs);
    }
  }

  private buildColumnDefs(columns: any[]): any[] {
    return columns.map(col => ({
      field: col.field,
      headerName: col.label || col.field,
      
      // Accessibility
      headerTooltip: col.description,
      
      // Features
      sortable: col.sortable !== false,
      filter: col.filter !== false,
      editable: col.editable === true,
      resizable: col.resizable !== false,
      
      // Cell rendering
      cellRenderer: col.cellRenderer,
      cellEditor: col.cellEditor,
      
      // Value formatting
      valueFormatter: col.valueFormatter,
      valueGetter: col.valueGetter,
      valueSetter: col.valueSetter,
      
      // Width
      width: col.width,
      minWidth: col.minWidth,
      maxWidth: col.maxWidth,
      flex: col.flex,
      
      // Pinning
      pinned: col.pinned,
      
      // Grouping/Aggregation
      rowGroup: col.rowGroup,
      aggFunc: col.aggFunc,
      pivot: col.pivot,
      
      // Cell styling
      cellStyle: col.cellStyle,
      cellClass: col.cellClass,
      
      // Additional config
      ...col.config
    }));
  }

  private renderReact(schema: UISchema, gridOptions: any, a11yAttrs: any): any {
    // In actual implementation:
    // import { AgGridReact } from 'ag-grid-react';
    // import 'ag-grid-community/styles/ag-grid.css';
    // import 'ag-grid-community/styles/ag-theme-alpine.css';
    
    const React = require('react');
    
    const props = {
      id: schema.id,
      className: gridOptions.theme,
      ...gridOptions,
      ...a11yAttrs,
      'aria-label': a11yAttrs['aria-label'] || `${schema.label} data grid`,
      'role': 'grid'
    };

    // return <AgGridReact {...props} />;
    return React.createElement('div', {
      ...props,
      'data-grid-type': 'ag-grid',
      'data-framework': 'react'
    }, 'AG-Grid (React)');
  }

  private renderAngular(schema: UISchema, gridOptions: any, a11yAttrs: any): any {
    // In actual implementation:
    // <ag-grid-angular
    //   [gridOptions]="gridOptions"
    //   [rowData]="rowData"
    //   [columnDefs]="columnDefs"
    // ></ag-grid-angular>
    
    return {
      component: 'ag-grid-angular',
      inputs: {
        gridOptions,
        ...a11yAttrs
      },
      framework: 'angular'
    };
  }

  private renderVue(schema: UISchema, gridOptions: any, a11yAttrs: any): any {
    // In actual implementation:
    // <ag-grid-vue
    //   :gridOptions="gridOptions"
    //   :rowData="rowData"
    //   :columnDefs="columnDefs"
    // ></ag-grid-vue>
    
    return {
      component: 'ag-grid-vue',
      props: {
        gridOptions,
        ...a11yAttrs
      },
      framework: 'vue'
    };
  }
}

/**
 * AG-Grid Enterprise Adapter (extends base with enterprise features)
 */
export class AGGridEnterpriseAdapter extends AGGridAdapter {
  getLibraryName(): string {
    return 'ag-grid-enterprise';
  }

  render(schema: UISchema, context?: RenderContext): any {
    const config = this.getResponsiveConfig(schema, context?.device);
    
    // Add enterprise features
    const enterpriseConfig = {
      ...config,
      
      // Master-detail
      masterDetail: config?.masterDetail === true,
      detailCellRendererParams: config?.detailCellRendererParams,
      
      // Row grouping
      autoGroupColumnDef: config?.autoGroupColumnDef,
      groupDefaultExpanded: config?.groupDefaultExpanded,
      
      // Set filtering
      enableRangeSelection: config?.rangeSelection !== false,
      
      // Excel export
      enableExcelExport: config?.excelExport !== false,
      
      // Advanced filtering
      enableAdvancedFilter: config?.advancedFilter === true,
      
      // Charts
      enableCharts: config?.charts === true,
      
      // Clipboard
      enableClipboard: config?.clipboard !== false,
      
      // Status bar
      statusBar: config?.statusBar,
      
      // Side bar (columns tool panel)
      sideBar: config?.sideBar || {
        toolPanels: ['columns', 'filters']
      }
    };

    // Call parent with enhanced config
    return super.render({
      ...schema,
      config: enterpriseConfig
    }, context);
  }
}
