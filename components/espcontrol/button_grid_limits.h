#pragma once

// Fixed capacities shared by the grid and its behaviour modules. Devices may
// lower the main-grid limit with a build flag, but saved configuration and
// allocation lifetimes remain unchanged.
#ifndef ESPCONTROL_MAX_GRID_SLOTS
#define ESPCONTROL_MAX_GRID_SLOTS 25
#endif

constexpr int MAX_GRID_SLOTS = ESPCONTROL_MAX_GRID_SLOTS;
static_assert(MAX_GRID_SLOTS > 0, "ESPCONTROL_MAX_GRID_SLOTS must be positive");
constexpr int MAX_SUBPAGE_ITEMS = MAX_GRID_SLOTS * MAX_GRID_SLOTS;

// Half-row positions are independent of the number of configured cards.
constexpr int MAX_GRID_POSITIONS = MAX_GRID_SLOTS * 4;
inline int grid_position_count(int slots, int cols) {
  if (cols < 1) cols = 1;
  if (cols > MAX_GRID_SLOTS) cols = MAX_GRID_SLOTS;
  if (slots < 0) slots = 0;
  return (((slots < MAX_GRID_SLOTS ? slots : MAX_GRID_SLOTS) + cols - 1) / cols) * cols * 2;
}
