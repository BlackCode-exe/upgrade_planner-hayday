# Material Upgrade Planner – Hay Day  
**Version:** 1.4.0  
**Author:** Black Production®  

==============================  

## Overview  
Material Upgrade Planner is a web-based simulation tool that helps players plan **one-step storage upgrades** (e.g. moving from 2,700 to 2,750 capacity) and **land expansions**. You enter your target, optionally provide your current inventory of tools, and the app forecasts what you need and how best to use your stock across days — while honoring daily usage limits.  

This tool only runs a **single-step upgrade simulation**. For example, if you choose 2,750 as your target, the app assumes your current capacity is 2,700 and calculates the requirement for that one upgrade increment. It does not attempt multiple upgrades or expansions at once.  

==============================  

## Features  
- **One-Step Capacity Simulation** – Calculates the exact tools needed for the next upgrade step.  
- **Expansion Support** – Shows required tools for unlocking new land areas.  
- **Optional Daily Plan** – If you input your current stock, the app creates a balanced daily distribution plan.  
- **Fair Allocation** – Distributes tool usage evenly across categories while respecting a daily slot limit.  
- **Clean, Responsive UI** – Quick inputs, real-time feedback, and easy readability.  

==============================  

## How to Use  
1. Load the app in your browser.  
2. Enter your **Target Capacity** (e.g., 2750). This implies your current storage is one step lower (e.g., 2700).  
3. Optionally, enter your current stock of each tool:  
   - Storage upgrades (Barn/Silo): Bolt, Plank, Duct Tape  
   - Land expansions: Land Deed, Mallet, Marker Stake  
4. Click **Calculate**.  
5. The app shows:  
   - The number of tools required to reach the next upgrade.  
   - If stock was provided, a daily distribution plan that balances usage and never exceeds the daily cap.  

### Example Walkthrough  
- Target Capacity: 2750 (implying current is 2700)  
- Tools Required: Bolt: 73, Plank: 73, Duct Tape: 73  
- User Stock: Bolt: 9, Plank: 12, Duct Tape: 25  
- Simulation Output:  
  - Requirement notice: “You need 73 of each tool.”  
  - Daily distribution plan might look like:  
    - Day 1: Bolt +36, Plank +34, Duct Tape +19 (capped at limit)  
    - Day 2: Continue until all reach 73  
    - Totals always balanced per day and capped at the daily slot limit  

==============================  

## Purpose  
Material Upgrade Planner is a **strategic companion** for players who want clarity and fairness in planning upgrades and expansions. It removes guesswork and helps optimize progress with structured, day-by-day guidance.  

==============================  

## FAQ  

**Q: Why does the app only simulate one-step upgrades?**  
A: Each step has unique requirements. This tool focuses on the **next step only** to ensure accuracy.  

**Q: What happens if I don’t enter my current stock?**  
A: You’ll just see the required number of tools. A daily plan only appears if you enter stock.  

**Q: Can this plan exceed the daily slot limit?**  
A: No. The simulation enforces the limit. If you don’t have enough stock, the plan shows how many days it will take.  

**Q: Does this tool also cover land expansion?**  
A: Yes. For expansions, the app lists required tools and generates a daily distribution plan if stock is entered.  

==============================  

# Changelog  

All notable changes are documented here.  
This project follows [Semantic Versioning](https://semver.org/).  

==============================  

## v1.4.0 – Theme & UI Enhancements
- Implemented light/dark mode with persistent preference storage.
- Adapted tables, buttons, header, and footer to support both themes.  

==============================

## 1.3.2 — Distribution Slot Sorting  
- Distribution Slot table now sorts rows by **Amount ascending**.  
- Slot column remains sequential (1, 2, 3, …).  
- Improves readability by surfacing smallest slot values first.  

==============================  

## 1.3.0 — Balanced Distribution Edge Fix  
- Fixed: Day-1 distribution no longer exceeds the daily cap.  
- Improved distribution for large upgrades with low stock.  
- System leaves surplus unused when balance cannot be achieved.  
- Added feasibility notice for impossible Day-1 balance scenarios.  

==============================  

## 1.2.0 — Preset Scenarios & Input Handling  
- Fixed Clear/Preset buttons.  
- Inputs auto-clear when switching modes.  
- Added support for preset scenarios.  
- Improved workflow for quick-start simulations.  

==============================  

## 1.0.0 — First Stable Release  
- Complete one-step upgrade simulation (Barn, Silo, Expansion).  
- Balanced daily distribution plan with cap enforcement.  
- Support for requirement-only calculations when no stock is provided.  
- UX refinements: clearer messages, safer defaults.  

==============================  

## 0.5.0 — Planner Foundations  
- Introduced balanced daily distribution logic.  
- Added daily slot cap.  
- Basic mode switching.  

==============================  

## 0.1.0 — Prototype  
- Initial prototype for one-step upgrade calculation.  
- Displayed required items and shortages.  

==============================
