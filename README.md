<div align="center">
  <img src="https://raw.githubusercontent.com/tandpfun/skill-icons/main/icons/React-Dark.svg" width="60" alt="React" />
  <h1>👁️ VizFields</h1>
  <p><strong>Interactive Visual Pathway & Field Deficit Simulator for Neuroanatomy Education</strong></p>
  
  [![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
  [![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
</div>

<br />

## ✨ Overview

**VizFields** is an advanced, interactive, browser-based simulator designed to teach and explore the complex relationship between lesions in the human visual pathway and the resulting visual field deficits. 

With a stunning, immersive glassmorphic interface, it allows students, residents, and medical professionals to visually trace fibers from the retina to the occipital cortex and instantly observe the corresponding scotomas (blind spots).

---

## 🚀 Features

- **Interactive Visual Pathway Diagram**: A beautiful, fluid SVG representation of the optic nerves, chiasm, tracts, LGN, radiations, and visual cortex.
- **Real-Time Perimetry Simulation**: Dynamically places procedural "lesions" along the pathway to immediately see the resulting visual field deficits (e.g., bitemporal hemianopia, homonymous hemianopia, quadrantanopia).
- **Fiber Tracing**: Hover over a coordinate on the visual field map to trace the corresponding nerve fibers through the optic pathway.
- **Clinical Reasoning Panel**: Displays diagnostic clues, macular sparing analysis, vascular territory correlations, and board-style clinical pearls for the active lesion.
- **Humphrey-Style Test Animation**: Simulates a visual field test dynamically on screen.
- **Immersive Glassmorphism UI**: Built with a sleek, dark medical/scientific theme using modern CSS backdrop-filters.

---

## 🛠️ Tech Stack

VizFields is a fast, responsive Single Page Application (SPA) powered by:
- **[React 18](https://reactjs.org/)**: For component-based UI rendering.
- **[TypeScript](https://www.typescriptlang.org/)**: For robust, type-safe lesion and fiber-tracing engine logic.
- **[Vite](https://vitejs.dev/)**: For lightning-fast local development and optimal production bundling.

---

## 🏃‍♂️ Getting Started

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) (v16+) and npm installed.

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/vizfields.git
   cd vizfields
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run the development server:**
   ```bash
   npm run dev
   ```

4. **Explore the App:**
   Open your browser and navigate to `http://localhost:5173`.

---

## 📚 How to Use

1. **Place a Lesion**: Click anywhere on the central visual pathway diagram.
2. **Resize**: Drag the edges of the purple lesion circle to increase or decrease its size. Notice how partial lesions affect the visual field differently than complete transections.
3. **Trace Fibers**: Move your cursor over the left (`OS`) or right (`OD`) visual field perimetry circles to trace how light hitting that point travels through the brain.
4. **Clinical Cases**: Open the **Cases** tab on the right panel to test yourself on classical neuroanatomy board cases.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](../../issues).

## 📄 License

This project is open-source and available for educational use. 
