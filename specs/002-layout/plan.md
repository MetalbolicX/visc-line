# Implementation Plan: Layout

**Branch**: `002-layout` | **Date**: 2026-04-25 | **Spec**: `specs/002-layout/spec.md`

## Summary

Layout service calculates inner drawing dimensions. Pure function: `getDimensions(container, margins)` → `{width, height, innerWidth, innerHeight, margins}`.

## Technical Context

**Language/Version**: TypeScript 5.x | **Primary Dependencies**: None (pure DOM API)
**Testing**: Vitest + jsdom | **Target Platform**: Browser
**Project Type**: Library

## Architecture

Single exported function: `getDimensions(container: HTMLElement, margins: Margins): Dimensions`

## Source Code

```text
src/services/layout.mts       — getDimensions() implementation
src/services/__tests__/layout.test.mts — unit tests
src/chart/chartConstants.mts  — DEFAULT_MARGINS constant
src/types/layoutTypes.mts     — Dimensions, Margins types
```
