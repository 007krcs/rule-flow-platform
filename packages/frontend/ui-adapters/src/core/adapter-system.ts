/**
 * Universal UI Adapter System
 * 
 * This system allows ANY UI library to be used through a common adapter interface.
 * The backend sends UI schemas, and adapters translate them to library-specific components.
 * 
 * Supported libraries (easily extensible):
 * - Material-UI (React)
 * - AG-Grid (React/Angular/Vue)
 * - Ant Design (React)
 * - Highcharts (Universal)
 * - D3.js (Universal)
 * - Chart.js
 * - Recharts
 * - PrimeReact
 * - Vuetify (Vue)
 * - Quasar (Vue)
 * - Angular Material
 * - Bootstrap
 * - Tailwind UI
 * - Custom libraries
 */

// ============================================================================
// CORE INTERFACES (Framework-Agnostic)
// ============================================================================

export interface UISchema {
  id: string;
  type: 'input' | 'select' | 'table' | 'chart' | 'form' | 'button' | 'container' | 'custom';
  field?: string;
  label?: string;
  value?: any;
  options?: any;
  
  // Library hint (optional - can auto-detect)
  library?: string;  // 'material-ui' | 'ag-grid' | 'highcharts' | 'd3' | 'ant-design' | etc.
  
  // Component-specific configuration
  config?: Record<string, any>;
  
  // Accessibility (W3C WCAG)
  accessibility?: AccessibilityConfig;
  
  // Responsive configuration
  responsive?: ResponsiveConfig;
  
  // Children for nested components
  children?: UISchema[];
  
  // Validation rules
  validation?: ValidationConfig;
  
  // Events
  events?: EventConfig;
}

export interface AccessibilityConfig {
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaRequired?: boolean;
  ariaInvalid?: boolean;
  role?: string;
  tabIndex?: number;
  keyboardShortcut?: string;
  screenReaderText?: string;
  contrastRatio?: 'AA' | 'AAA';  // WCAG levels
  focusIndicator?: boolean;
  skipNavigation?: boolean;
}

export interface ResponsiveConfig {
  breakpoints?: {
    mobile?: any;    // <768px
    tablet?: any;    // 768-1024px
    desktop?: any;   // >1024px
  };
  adaptive?: boolean;  // Adapt to device capabilities
  touchOptimized?: boolean;
}

export interface ValidationConfig {
  required?: boolean;
  pattern?: string;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  custom?: string;  // Custom validation expression
}

export interface EventConfig {
  onChange?: string;
  onClick?: string;
  onBlur?: string;
  onFocus?: string;
  onSubmit?: string;
}

// ============================================================================
// ADAPTER INTERFACE (All adapters must implement this)
// ============================================================================

export interface UIAdapter {
  /**
   * Render a UI schema to a component
   * Returns framework-specific component (React, Vue, Angular)
   */
  render(schema: UISchema, context?: RenderContext): any;
  
  /**
   * Validate if this adapter can handle the schema
   */
  canHandle(schema: UISchema): boolean;
  
  /**
   * Get library name
   */
  getLibraryName(): string;
  
  /**
   * Validate accessibility compliance
   */
  validateAccessibility(schema: UISchema): AccessibilityReport;
}

export interface RenderContext {
  framework: 'react' | 'vue' | 'angular' | 'svelte';
  data: Record<string, any>;
  theme?: any;
  locale?: string;
  device?: 'mobile' | 'tablet' | 'desktop';
  onChange?: (field: string, value: any) => void;
  onEvent?: (event: string, payload: any) => void;
}

export interface AccessibilityReport {
  compliant: boolean;
  level: 'A' | 'AA' | 'AAA';
  issues: AccessibilityIssue[];
}

export interface AccessibilityIssue {
  severity: 'error' | 'warning' | 'info';
  message: string;
  wcagCriterion: string;  // e.g., "1.4.3" (contrast ratio)
  fix?: string;
}

// ============================================================================
// ADAPTER REGISTRY (Manages all adapters)
// ============================================================================

export class AdapterRegistry {
  private static adapters: Map<string, UIAdapter> = new Map();
  private static defaultAdapter: string = 'material-ui';

  /**
   * Register an adapter
   */
  static register(name: string, adapter: UIAdapter): void {
    this.adapters.set(name, adapter);
  }

  /**
   * Get adapter by name
   */
  static getAdapter(name: string): UIAdapter | undefined {
    return this.adapters.get(name);
  }

  /**
   * Get adapter for schema (auto-detect or use hint)
   */
  static getAdapterForSchema(schema: UISchema): UIAdapter {
    // 1. Check if schema specifies library
    if (schema.library && this.adapters.has(schema.library)) {
      return this.adapters.get(schema.library)!;
    }

    // 2. Find first adapter that can handle this schema
    for (const adapter of this.adapters.values()) {
      if (adapter.canHandle(schema)) {
        return adapter;
      }
    }

    // 3. Fall back to default adapter
    const defaultAdapter = this.adapters.get(this.defaultAdapter);
    if (!defaultAdapter) {
      throw new Error('No suitable adapter found and no default adapter set');
    }
    return defaultAdapter;
  }

  /**
   * Set default adapter
   */
  static setDefault(name: string): void {
    if (!this.adapters.has(name)) {
      throw new Error(`Adapter '${name}' not registered`);
    }
    this.defaultAdapter = name;
  }

  /**
   * List all registered adapters
   */
  static listAdapters(): string[] {
    return Array.from(this.adapters.keys());
  }
}

// ============================================================================
// BASE ADAPTER (Common functionality)
// ============================================================================

export abstract class BaseUIAdapter implements UIAdapter {
  abstract render(schema: UISchema, context?: RenderContext): any;
  abstract canHandle(schema: UISchema): boolean;
  abstract getLibraryName(): string;

  /**
   * Validate WCAG accessibility compliance
   */
  validateAccessibility(schema: UISchema): AccessibilityReport {
    const issues: AccessibilityIssue[] = [];

    // Check for aria-label or label
    if (!schema.accessibility?.ariaLabel && !schema.label) {
      issues.push({
        severity: 'error',
        message: 'Missing accessible label',
        wcagCriterion: '4.1.2',
        fix: 'Add "label" or "accessibility.ariaLabel" to schema'
      });
    }

    // Check for keyboard accessibility
    if (schema.type === 'button' && !schema.accessibility?.tabIndex) {
      issues.push({
        severity: 'warning',
        message: 'Button may not be keyboard accessible',
        wcagCriterion: '2.1.1',
        fix: 'Add "accessibility.tabIndex" to schema'
      });
    }

    // Check for required indicator
    if (schema.validation?.required && !schema.accessibility?.ariaRequired) {
      issues.push({
        severity: 'warning',
        message: 'Required field not indicated accessibly',
        wcagCriterion: '3.3.2',
        fix: 'Set "accessibility.ariaRequired: true"'
      });
    }

    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;

    return {
      compliant: errorCount === 0,
      level: errorCount === 0 && warningCount === 0 ? 'AAA' : 
             errorCount === 0 ? 'AA' : 'A',
      issues
    };
  }

  /**
   * Get responsive configuration for current device
   */
  protected getResponsiveConfig(schema: UISchema, device?: string): any {
    if (!schema.responsive?.breakpoints) {
      return schema.config;
    }

    const breakpoints = schema.responsive.breakpoints;
    const deviceConfig = device === 'mobile' ? breakpoints.mobile :
                        device === 'tablet' ? breakpoints.tablet :
                        breakpoints.desktop;

    return { ...schema.config, ...deviceConfig };
  }

  /**
   * Build accessibility attributes
   */
  protected buildA11yAttrs(schema: UISchema): Record<string, any> {
    const a11y = schema.accessibility || {};
    
    return {
      'aria-label': a11y.ariaLabel,
      'aria-describedby': a11y.ariaDescribedBy,
      'aria-required': a11y.ariaRequired,
      'aria-invalid': a11y.ariaInvalid,
      'role': a11y.role,
      'tabIndex': a11y.tabIndex,
      'data-keyboard-shortcut': a11y.keyboardShortcut
    };
  }
}

// ============================================================================
// SCHEMA RENDERER (Framework-Specific Wrappers)
// ============================================================================

/**
 * React Schema Renderer
 */
export class ReactSchemaRenderer {
  static render(schema: UISchema, context?: RenderContext): React.ReactElement {
    const adapter = AdapterRegistry.getAdapterForSchema(schema);
    const reactContext: RenderContext = { ...context, framework: 'react' };
    return adapter.render(schema, reactContext);
  }
}

/**
 * Vue Schema Renderer
 */
export class VueSchemaRenderer {
  static render(schema: UISchema, context?: RenderContext): any {
    const adapter = AdapterRegistry.getAdapterForSchema(schema);
    const vueContext: RenderContext = { ...context, framework: 'vue' };
    return adapter.render(schema, vueContext);
  }
}

/**
 * Angular Schema Renderer
 */
export class AngularSchemaRenderer {
  static render(schema: UISchema, context?: RenderContext): any {
    const adapter = AdapterRegistry.getAdapterForSchema(schema);
    const ngContext: RenderContext = { ...context, framework: 'angular' };
    return adapter.render(schema, ngContext);
  }
}
