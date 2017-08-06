// Editor metadata for items

export default class Metadata {
  constructor(metadata={}) {
    if (metadata.angle === undefined) metadata.angle = 0;
    if (metadata.visible === undefined) metadata.visible = true;
    if (metadata.locked === undefined) metadata.locked = false;

    // Defaults
    this.angle = metadata.angle;
    this.visible = metadata.visible;
    this.locked = metadata.locked;
  }
}
