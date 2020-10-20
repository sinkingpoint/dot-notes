export type NestedListData<T> = T | NestedList<T>;

type SourceData<T> = T | SourceData<T>[];
function listify<T>(data: SourceData<T>[]): NestedList<T> {
  const newData = data.map((val) => {
    if(val instanceof Array) {
      return listify(val);
    }
    else {
      return val;
    }
  });

  return new NestedList<T>(newData);
}

class NestedList<T> {
  data: NestedListData<T>[];
  constructor(data?: NestedListData<T> | NestedListData<T>[] | SourceData<T>[]) {
    if(data instanceof Array) {
      let hasArray = false;
      data.forEach((val: NestedListData<T> | SourceData<T>) => {
        if(val instanceof Array) {
          hasArray = true;
        }
      });

      if(!hasArray) {
        this.data = data as NestedListData<T>[];
      }
      else {
        this.data = (listify(data) as NestedList<T>).data;
      }
    }
    else if(data) {
      this.data = [data];
    }
    else {
      this.data = [];
    }
  }

  clone(): NestedList<T> {
    // Quick and dirty for now. Need to fix
    return new NestedList<T>(JSON.parse(JSON.stringify(this.data)));
  }

  get(indices: number[]): NestedListData<T> {
    if(indices.length == 1) {
      return this.data[indices[0]];
    }
    else {
      const data = this.data[indices[0]];
      if(data instanceof NestedList) {
        return data.get(indices.slice(1));
      }
      else {
        throw "Bad indices - non final index doesn't point to array";
      }
    }
  }

  set(indices: number[], newData: NestedListData<T>): void {
    if(indices.length == 1) {
      this.data[indices[0]] = newData;
    }
    else {
      const data = this.data[indices[0]];
      if(data instanceof NestedList) {
        data.set(indices.slice(1), newData);
      }
      else {
        throw "Bad indices - non final index doesn't point to array";
      }
    }
  }

  push(indices: number[], newData: NestedListData<T>): void {
    if(indices.length == 1) {
      const lastIndex = indices[0];
      const front = (this.data as NestedListData<T>[]).slice(0, lastIndex+1);
      const back = (this.data as NestedListData<T>[]).slice(lastIndex+1);
      this.data = front.concat([newData], back);
    }
    else {
      const data = this.data[indices[0]];
      if(data instanceof NestedList) {
        data.push(indices.slice(1), newData);
      }
      else {
        console.log("Adding ", newData, " with ", indices, " in ", this.data, data, data instanceof NestedList);
        console.log(NestedList);
        throw "Bad indices - non final index doesn't point to array";
      }
    }
  }

  delete(indices: number[]): void {
    if(indices.length == 1) {
      const lastIndex = indices[0];
      const front = (this.data as NestedListData<T>[]).slice(0, lastIndex);
      const back = (this.data as NestedListData<T>[]).slice(lastIndex+1);
      this.data = front.concat(back);
    }
    else {
      const data = this.data[indices[0]];
      if(data instanceof NestedList) {
        data.delete(indices.slice(1));
      }
      else {
        throw "Bad indices - non final index doesn't point to array";
      }
    }
  }

  nest(indices: number[]): void {
    const data = this.data;

    if(indices.length == 1) {
      const lastIndex = indices[0];
      if(data[lastIndex-1] instanceof Array) {
        this.delete(indices);
      }
    }
  }
}

export default NestedList;