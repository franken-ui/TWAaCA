class TWML {
  constructor() {
    this.breakpoints = {
      sm: "640px",
      md: "768px",
      lg: "1024px",
      xl: "1280px",
    };

    // Alias map for Tailwind shorthand to full property names
    this.propertyAliases = {
      w: "width",
      h: "height",
      "max-w": "max-width",
      "max-h": "max-height",
      "min-w": "min-width",
      "min-h": "min-height",
      p: "padding",
      px: "padding-x",
      py: "padding-y",
      pt: "padding-top",
      pr: "padding-right",
      pb: "padding-bottom",
      pl: "padding-left",
      m: "margin",
      mx: "margin-x",
      my: "margin-y",
      mt: "margin-top",
      mr: "margin-right",
      mb: "margin-bottom",
      ml: "margin-left",
      bg: "background-color",
      text: "color",
      rounded: "border-radius",
    };

    this.generatedClasses = new Set();
    this.cssRules = new Map(); // Use Map for deduplication
    this.ruleOrder = []; // Track insertion order

    // Modify predefinedValues to remove font-size (we'll handle it separately)
    this.predefinedValues = {
      "aspect-ratio": {
        square: "1 / 1",
        video: "16 / 9",
        portrait: "3 / 4",
        landscape: "4 / 3",
      },
      "font-weight": {
        thin: "100",
        light: "300",
        normal: "400",
        medium: "500",
        semibold: "600",
        bold: "700",
        black: "900",
      },
    };
  }

  // Dynamically find all data-tw-* attributes in the document
  findAllDataTwAttributes() {
    const attributes = new Set();
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_ELEMENT,
      null,
      false
    );

    let node;
    while ((node = walker.nextNode())) {
      Array.from(node.attributes).forEach((attr) => {
        if (attr.name.startsWith("data-tw-")) {
          attributes.add(attr.name);
        }
      });
    }

    return Array.from(attributes);
  }

  // Check if a color is predefined in CSS variables
  isColorDefined(color) {
    const computedStyle = getComputedStyle(document.documentElement);
    return computedStyle.getPropertyValue(`--color-${color}`).trim() !== "";
  }

  // Convert property alias to actual CSS property
  resolveProperty(property) {
    return this.propertyAliases[property] || property;
  }

  // Generate CSS properties from resolved property name
  getCSSProperties(property) {
    switch (property) {
      case "padding-x":
        return ["padding-left", "padding-right"];
      case "padding-y":
        return ["padding-top", "padding-bottom"];
      case "margin-x":
        return ["margin-left", "margin-right"];
      case "margin-y":
        return ["margin-top", "margin-bottom"];
      default:
        return [property];
    }
  }

  // Add new method to check for predefined font sizes
  isPredefinedFontSize(value) {
    return [
      "xs",
      "sm",
      "base",
      "lg",
      "xl",
      "2xl",
      "3xl",
      "4xl",
      "5xl",
      "6xl",
      "7xl",
      "8xl",
      "9xl",
    ].includes(value);
  }

  // Add new method to resolve predefined values
  resolvePredefinedValue(property, value) {
    const resolvedProperty = this.resolveProperty(property);

    if (
      this.predefinedValues[resolvedProperty] &&
      this.predefinedValues[resolvedProperty][value]
    ) {
      return this.predefinedValues[resolvedProperty][value];
    }

    return value;
  }

  // Generate CSS value based on property and value
  generateCSSValue(property, value) {
    const resolvedProperty = this.resolveProperty(property);

    // Special handling for font-size
    if (resolvedProperty === "font-size") {
      if (this.isPredefinedFontSize(value)) {
        return {
          "font-size": `var(--font-size-${value})`,
          "line-height": `var(--font-size-${value}--line-height)`,
        };
      }

      // Handle numeric values for font-size
      if (/^\d+$/.test(value)) {
        return { "font-size": `calc(var(--spacing) * ${value})` };
      }

      return { "font-size": value }; // For values with units (e.g., 1.5rem, 16px)
    }

    // Check predefined values for other properties
    const predefinedValue = this.resolvePredefinedValue(property, value);
    if (predefinedValue !== value) {
      return predefinedValue;
    }

    // Handle colors
    if (this.isColorProperty(property)) {
      if (this.isColorDefined(value)) {
        return `var(--color-${value})`;
      }
      return value;
    }

    // Handle numeric values (spacing-based)
    if (/^\d+$/.test(value)) {
      if (this.isSpacingProperty(property)) {
        return `calc(var(--spacing) * ${value})`;
      }
    }

    // Handle special cases
    if (property === "grid-template-columns" && /^\d+$/.test(value)) {
      return `repeat(${value}, minmax(0, 1fr))`;
    }

    return value;
  }

  // Check if property is color-related
  isColorProperty(property) {
    return ["color", "background-color", "border-color"].includes(property);
  }

  // Check if property uses spacing values
  isSpacingProperty(property) {
    const spacingProps = [
      "width",
      "height",
      "max-width",
      "max-height",
      "min-width",
      "min-height",
      "padding",
      "padding-top",
      "padding-right",
      "padding-bottom",
      "padding-left",
      "margin",
      "margin-top",
      "margin-right",
      "margin-bottom",
      "margin-left",
      "gap",
      "border-radius",
      "top",
      "right",
      "bottom",
      "left",
    ];
    return spacingProps.includes(property);
  }

  // Parse variant:value format (e.g., "md:16", "hover:6")
  parseVariant(variantValue) {
    const parts = variantValue.split(":");
    if (parts.length === 2) {
      return {
        variant: parts[0],
        value: parts[1],
      };
    }
    return {
      variant: null,
      value: variantValue,
    };
  }

  // Generate class name from property and value
  generateClassName(originalProperty, value, variant = null) {
    let className = `${originalProperty}-${value}`;
    if (variant) {
      className = `${variant}\\:${originalProperty}-${value}`;
    }
    return className;
  }

  // Modify generateCSSRule to handle multiple CSS properties
  generateCSSRule(className, cssProperties, value, variant = null) {
    const cssValue = this.generateCSSValue(cssProperties[0], value);

    let rules;
    if (typeof cssValue === "object") {
      // Handle multiple properties (like font-size with line-height)
      rules = Object.entries(cssValue)
        .map(([prop, val]) => `      ${prop}: ${val};`)
        .join("\n");
    } else {
      rules = cssProperties
        .map((prop) => `      ${prop}: ${cssValue};`)
        .join("\n");
    }

    let rule = `    .${className} {\n${rules}\n    }`;

    // Apply variants with proper ordering priority
    if (variant && this.breakpoints[variant]) {
      // Responsive variant
      rule = `@media (min-width: ${this.breakpoints[variant]}) {\n${rule}\n}`;

      return { rule, priority: this.getVariantPriority(variant) };
    } else if (variant === "hover") {
      rule = `    .${className}:hover {\n${rules}\n    }`;
      return { rule, priority: 100 };
    } else if (variant === "focus") {
      rule = `    .${className}:focus {\n${rules}\n    }`;
      return { rule, priority: 101 };
    } else if (variant === "active") {
      rule = `    .${className}:active {\n${rules}\n    }`;
      return { rule, priority: 102 };
    } else if (variant === "dark") {
      rule = `    .dark .${className} {\n${rules}\n    }`;
      return { rule, priority: 200 };
    }

    return { rule, priority: 0 };
  }

  // Get priority for proper CSS ordering
  getVariantPriority(variant) {
    const priorities = {
      sm: 10,
      md: 20,
      lg: 30,
      xl: 40,
    };
    return priorities[variant] || 0;
  }

  // Process a single data-tw attribute
  processAttribute(element, originalProperty, attributeValue) {
    const values = attributeValue.trim().split(/\s+/);
    const classesToAdd = [];

    // Resolve property alias to actual CSS property
    const resolvedProperty = this.resolveProperty(originalProperty);
    const cssProperties = this.getCSSProperties(resolvedProperty);

    values.forEach((value) => {
      const { variant, value: actualValue } = this.parseVariant(value);
      const className = this.generateClassName(
        originalProperty,
        actualValue,
        variant
      );

      if (!this.generatedClasses.has(className)) {
        this.generatedClasses.add(className);
        const { rule, priority } = this.generateCSSRule(
          className,
          cssProperties,
          actualValue,
          variant
        );

        // Store rule with priority for sorting
        const ruleKey = `${priority}-${className}`;
        if (!this.cssRules.has(ruleKey)) {
          this.cssRules.set(ruleKey, rule);
          this.ruleOrder.push({ key: ruleKey, priority });
        }
      }

      classesToAdd.push(className.replace(/\\/g, ""));
    });

    return classesToAdd;
  }

  // Main generation function
  generate() {
    this.generatedClasses.clear();
    this.cssRules.clear();
    this.ruleOrder = [];

    // Dynamically find all data-tw-* attributes
    const dataAttributes = this.findAllDataTwAttributes();
    const selector = dataAttributes.map((attr) => `[${attr}]`).join(", ");

    if (!selector) return "";

    const elements = document.querySelectorAll(selector);

    elements.forEach((element) => {
      const newClasses = [];

      // Process each data-tw-* attribute
      Array.from(element.attributes).forEach((attr) => {
        if (attr.name.startsWith("data-tw-")) {
          const property = attr.name.replace("data-tw-", "");
          const classes = this.processAttribute(element, property, attr.value);
          newClasses.push(...classes);

          // Remove the data attribute
          element.removeAttribute(attr.name);
        }
      });

      // Add generated classes to the element
      if (newClasses.length > 0) {
        const existingClasses = element.className.trim();
        const allClasses = existingClasses
          ? `${existingClasses} ${newClasses.join(" ")}`
          : newClasses.join(" ");
        element.className = allClasses;
      }
    });

    // Sort rules by priority to avoid CSS conflicts
    this.ruleOrder.sort((a, b) => a.priority - b.priority);
    const sortedRules = this.ruleOrder.map((item) =>
      this.cssRules.get(item.key)
    );

    // Wrap in @layer utilities
    return `@layer utilities {\n${sortedRules.join("\n\n")}\n}`;
  }

  // Inject generated CSS into the document
  injectCSS(css) {
    const existingStyle = document.getElementById("tw-generated-styles");
    if (existingStyle) {
      existingStyle.remove();
    }

    const style = document.createElement("style");
    style.id = "tw-generated-styles";
    style.textContent = css;
    document.head.appendChild(style);
  }

  // Initialize and run the generator
  init() {
    const generatedCSS = this.generate();
    if (generatedCSS) {
      this.injectCSS(generatedCSS);
    }
    return generatedCSS;
  }

  // Auto-initialize system with DOM monitoring
  setupAutoInit() {
    const runGeneration = () => {
      const generatedCSS = this.generate();
      if (generatedCSS) {
        this.injectCSS(generatedCSS);
      }
    };

    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", runGeneration);
    } else {
      runGeneration();
    }

    // Monitor for new elements with data-tw attributes
    const observer = new MutationObserver((mutations) => {
      let hasNewDataTwAttributes = false;

      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const hasDataTw = Array.from(node.attributes || []).some((attr) =>
                attr.name.startsWith("data-tw-")
              );
              const hasChildrenWithDataTw =
                node.querySelectorAll &&
                node.querySelectorAll("[data-tw-]").length > 0;

              if (hasDataTw || hasChildrenWithDataTw) {
              }
            }
          });
        }
      });

      if (hasNewDataTwAttributes) {
        const generatedCSS = this.generate();
        if (generatedCSS) {
          this.injectCSS(generatedCSS);
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }
}

// Auto-initialize when script loads
if (typeof document !== "undefined") {
  const generator = new TWML();
  generator.setupAutoInit();

  // Make available globally for manual use
  window.TWML = TWML;
  window.twGenerator = generator;
}
