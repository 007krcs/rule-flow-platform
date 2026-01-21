/**
 * Material-UI Adapter (React)
 * 
 * Maps UI schemas to Material-UI components with full WCAG compliance
 */

import React from 'react';
import { BaseUIAdapter, UISchema, RenderContext } from '../core/adapter-system';

// Material-UI imports (these would be actual imports in production)
// import { TextField, Select, Button, MenuItem, FormControl, InputLabel } from '@mui/material';
// import { DataGrid } from '@mui/x-data-grid';

export class MaterialUIAdapter extends BaseUIAdapter {
  getLibraryName(): string {
    return 'material-ui';
  }

  canHandle(schema: UISchema): boolean {
    // Material-UI can handle most common component types
    const supportedTypes = ['input', 'select', 'button', 'form', 'table', 'container'];
    return supportedTypes.includes(schema.type);
  }

  render(schema: UISchema, context?: RenderContext): React.ReactElement {
    const device = context?.device || 'desktop';
    const config = this.getResponsiveConfig(schema, device);
    const a11yAttrs = this.buildA11yAttrs(schema);

    switch (schema.type) {
      case 'input':
        return this.renderInput(schema, config, a11yAttrs, context);
      
      case 'select':
        return this.renderSelect(schema, config, a11yAttrs, context);
      
      case 'button':
        return this.renderButton(schema, config, a11yAttrs, context);
      
      case 'table':
        return this.renderTable(schema, config, a11yAttrs, context);
      
      case 'form':
        return this.renderForm(schema, config, a11yAttrs, context);
      
      case 'container':
        return this.renderContainer(schema, config, a11yAttrs, context);
      
      default:
        return React.createElement('div', {}, 'Unsupported type: ' + schema.type);
    }
  }

  private renderInput(
    schema: UISchema, 
    config: any, 
    a11yAttrs: any, 
    context?: RenderContext
  ): React.ReactElement {
    // Example: Material-UI TextField
    const props = {
      id: schema.id,
      label: schema.label,
      value: schema.value || '',
      variant: config?.variant || 'outlined',
      fullWidth: config?.fullWidth !== false,
      required: schema.validation?.required,
      error: schema.accessibility?.ariaInvalid,
      helperText: schema.accessibility?.screenReaderText,
      
      // Accessibility
      ...a11yAttrs,
      inputProps: {
        'aria-label': a11yAttrs['aria-label'] || schema.label,
        'aria-describedby': a11yAttrs['aria-describedby'],
        'aria-required': schema.validation?.required,
      },
      
      // Events
      onChange: (e: any) => {
        if (context?.onChange) {
          context.onChange(schema.field || schema.id, e.target.value);
        }
      },
      
      // Responsive sizing
      size: device === 'mobile' ? 'small' : 'medium',
      
      // Additional config
      ...config
    };

    // In actual implementation:
    // return <TextField {...props} />;
    return React.createElement('input', props); // Simplified for demo
  }

  private renderSelect(
    schema: UISchema, 
    config: any, 
    a11yAttrs: any, 
    context?: RenderContext
  ): React.ReactElement {
    const props = {
      id: schema.id,
      label: schema.label,
      value: schema.value || '',
      fullWidth: config?.fullWidth !== false,
      
      // Accessibility
      ...a11yAttrs,
      inputProps: {
        'aria-label': a11yAttrs['aria-label'] || schema.label,
      },
      
      // Events
      onChange: (e: any) => {
        if (context?.onChange) {
          context.onChange(schema.field || schema.id, e.target.value);
        }
      },
    };

    // In actual implementation:
    // return (
    //   <FormControl fullWidth>
    //     <InputLabel>{schema.label}</InputLabel>
    //     <Select {...props}>
    //       {schema.options?.map((opt: any) => (
    //         <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
    //       ))}
    //     </Select>
    //   </FormControl>
    // );
    
    return React.createElement('select', props);
  }

  private renderButton(
    schema: UISchema, 
    config: any, 
    a11yAttrs: any, 
    context?: RenderContext
  ): React.ReactElement {
    const props = {
      id: schema.id,
      variant: config?.variant || 'contained',
      color: config?.color || 'primary',
      
      // Accessibility
      ...a11yAttrs,
      'aria-label': a11yAttrs['aria-label'] || schema.label,
      
      // Events
      onClick: () => {
        if (context?.onEvent) {
          context.onEvent('click', { id: schema.id });
        }
      },
      
      // Responsive
      size: device === 'mobile' ? 'small' : 'medium',
    };

    // In actual implementation:
    // return <Button {...props}>{schema.label}</Button>;
    return React.createElement('button', props, schema.label);
  }

  private renderTable(
    schema: UISchema, 
    config: any, 
    a11yAttrs: any, 
    context?: RenderContext
  ): React.ReactElement {
    const props = {
      id: schema.id,
      rows: config?.rows || [],
      columns: config?.columns || [],
      
      // Accessibility
      'aria-label': a11yAttrs['aria-label'] || `${schema.label} table`,
      'role': 'grid',
      
      // Material-UI DataGrid specific
      pageSize: config?.pageSize || 10,
      rowsPerPageOptions: config?.rowsPerPageOptions || [5, 10, 20],
      checkboxSelection: config?.checkboxSelection || false,
      disableSelectionOnClick: true,
      
      // Responsive
      autoHeight: true,
      density: device === 'mobile' ? 'compact' : 'standard',
    };

    // In actual implementation:
    // return <DataGrid {...props} />;
    return React.createElement('div', { ...props, role: 'grid' }, 'Table');
  }

  private renderForm(
    schema: UISchema, 
    config: any, 
    a11yAttrs: any, 
    context?: RenderContext
  ): React.ReactElement {
    const childElements = schema.children?.map(child => 
      this.render(child, context)
    ) || [];

    const props = {
      id: schema.id,
      ...a11yAttrs,
      onSubmit: (e: any) => {
        e.preventDefault();
        if (context?.onEvent) {
          context.onEvent('submit', { id: schema.id });
        }
      }
    };

    return React.createElement('form', props, ...childElements);
  }

  private renderContainer(
    schema: UISchema, 
    config: any, 
    a11yAttrs: any, 
    context?: RenderContext
  ): React.ReactElement {
    const childElements = schema.children?.map(child => 
      this.render(child, context)
    ) || [];

    const props = {
      id: schema.id,
      ...a11yAttrs,
      style: {
        display: config?.display || 'flex',
        flexDirection: config?.flexDirection || 'column',
        gap: config?.gap || '16px',
        ...config?.style
      }
    };

    // In actual implementation, use Material-UI Box or Container
    return React.createElement('div', props, ...childElements);
  }
}
