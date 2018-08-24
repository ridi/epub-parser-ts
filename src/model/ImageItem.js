import { mergeObjects } from '../utils';
import Item from './Item';

class ImageItem extends Item {
  constructor(rawObj) {
    super(rawObj);
    this.isCover = rawObj.isCover || false;
    Object.freeze(this);
  }

  toRaw() {
    return mergeObjects(super.toRaw(), {
      isCover: this.isCover,
      itemType: ImageItem.name,
    });
  }
}

export default ImageItem;
