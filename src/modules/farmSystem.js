export function createFarmSystem() {
  return {
    plants: [],
    registerPlant(plant) {
      this.plants.push(plant);
    },
  };
}
