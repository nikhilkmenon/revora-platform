---
name: Revora Luxury Minimalist
colors:
  surface: '#fef7ff'
  surface-dim: '#dfd7e5'
  surface-bright: '#fef7ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f9f1ff'
  surface-container: '#f3ebf9'
  surface-container-high: '#ede5f3'
  surface-container-highest: '#e8e0ee'
  on-surface: '#1d1a24'
  on-surface-variant: '#4a4455'
  inverse-surface: '#332f39'
  inverse-on-surface: '#f6eefc'
  outline: '#7b7486'
  outline-variant: '#ccc3d7'
  surface-tint: '#7331df'
  primary: '#5300b7'
  on-primary: '#ffffff'
  primary-container: '#6d28d9'
  on-primary-container: '#dac5ff'
  inverse-primary: '#d3bbff'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#6b3000'
  on-tertiary: '#ffffff'
  tertiary-container: '#8f4200'
  on-tertiary-container: '#ffc19e'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ebddff'
  primary-fixed-dim: '#d3bbff'
  on-primary-fixed: '#250059'
  on-primary-fixed-variant: '#5b00c5'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#ffdbc8'
  tertiary-fixed-dim: '#ffb68b'
  on-tertiary-fixed: '#321300'
  on-tertiary-fixed-variant: '#743400'
  background: '#fef7ff'
  on-background: '#1d1a24'
  surface-variant: '#e8e0ee'
typography:
  display-lg:
    fontFamily: Sora
    fontSize: 48px
    fontWeight: '600'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Sora
    fontSize: 36px
    fontWeight: '600'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Sora
    fontSize: 32px
    fontWeight: '500'
    lineHeight: '1.2'
  headline-sm:
    fontFamily: Sora
    fontSize: 24px
    fontWeight: '500'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  base: 8px
  container-max: 1280px
  gutter: 24px
  margin-desktop: 64px
  margin-mobile: 20px
  stack-sm: 12px
  stack-md: 32px
  stack-lg: 80px
---

## Brand & Style

The design system is anchored in "Modern Luxury Technology"—a synthesis of high-fashion editorial aesthetics and cutting-edge digital precision. The UI acts as a silent, premium frame for high-resolution product imagery, evoking a sense of calm, exclusivity, and effortless sophistication. 

The style combines **Minimalism** with subtle **Glassmorphism**. By prioritizing expansive whitespace and a "product-first" hierarchy, the system achieves an Apple-level clarity that builds immediate trust. The "Soft Futuristic" depth is achieved not through heavy gradients, but through delicate translucent layers and precise, light-reflective surfaces.

## Colors

The palette is restrained and intentional. The **Primary Deep Purple** serves as the signature of luxury, used for key actions and brand moments. The **Soft Electric Blue** is reserved for functional accents, signaling interactive technology or secondary highlights. 

The background strategy utilizes **Surface White** for primary content areas and **Surface-Dim** to create subtle tonal contrast between sections without the need for heavy borders. Text remains high-contrast for maximum legibility, adhering to a "content-above-all" philosophy.

## Typography

This design system uses a dual-font approach to balance personality with utility. **Sora** provides a geometric, modern-luxury feel for headlines, featuring unique apertures that suggest technological innovation. **Inter** is utilized for all functional and body text to provide systematic, neutral legibility.

Hierarchy is aggressive; large display sizes are used to create an editorial "magazine" feel on desktop. Mobile typography scales down significantly to maintain clarity without overwhelming the smaller viewport.

## Layout & Spacing

The layout philosophy centers on a **Fixed Grid** for desktop to preserve the premium, curated feel of a boutique, while transitioning to a **Fluid Grid** for mobile. A 12-column system is used with generous gutters to allow the "breathable" luxury aesthetic to flourish.

Whitespace is treated as a core design element. Large vertical stacks (80px+) are used to separate major content blocks, preventing the UI from feeling "crowded" or "discount." On mobile, margins are tightened but the vertical rhythm remains open.

## Elevation & Depth

Depth in the design system is communicated through **Tonal Layers** and **Glassmorphism** rather than traditional heavy shadows. 

1.  **Base Layer:** The Surface-Dim background.
2.  **Raised Layer:** Surface White cards with a 1px soft-grey stroke or an ultra-diffused, 2% opacity shadow.
3.  **Floating Layer:** Glassmorphic navigation bars and modals using a 20px backdrop-blur and 80% opacity Surface White fills.

Shadows, where used, are "Ambient Shadows"—highly diffused with a large blur radius and a slight tint of the Primary color to maintain a soft, integrated look.

## Shapes

The shape language is defined by **Pill-shaped** and **Soft-Large** containers. A base radius of 16px is used for smaller components like input fields, while 32px or full-pill rounding is applied to buttons and primary cards. This softness offsets the technical nature of the marketplace, making the experience feel approachable and high-end.

## Components

### Buttons
Primary buttons are pill-shaped, using the Deep Purple background with White text. Hover states should include a subtle scale-up (1.02x) rather than a drastic color change. Secondary buttons use a glassmorphic "ghost" style with a 1px border.

### Input Fields
Inputs are minimalist: a Soft-Dim background with no border in the default state, transitioning to a 1px Electric Blue border on focus. Labels are always positioned above the field in the `label-md` style.

### Cards
Product cards are borderless on Surface-Dim backgrounds, utilizing Surface White fills. They feature a generous 24px internal padding. Product imagery should always have the same 16px corner radius as the container.

### Chips & Tags
Used for categories or status. These are small pill-shapes with a subtle tonal background (5% opacity of the Primary color) and high-contrast text.

### Navigation
The header should be a floating, glassmorphic element that sits 24px from the top of the viewport, emphasizing the "soft futuristic" depth of the system.