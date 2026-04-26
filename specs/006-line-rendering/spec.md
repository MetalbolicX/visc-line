# Feature Specification: Line Rendering

**Feature Branch**: `006-line-rendering` | **Created**: 2026-04-25 | **Status**: Draft

Line path rendering with configurable D3 curve interpolation.

**Requirements**: renderLine creates `<path>` per series using scales and curves.
**Success Criteria**: 1 path per series, curve from theme, empty series = no path.
