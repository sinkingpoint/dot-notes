import fromMarkdown from 'mdast-util-from-markdown';
import { syntax } from '.';
import md from './fromMarkdown'

test('frommd', () => {
  expect(fromMarkdown('[ ] test', {
    extensions: [syntax],
    mdastExtensions: [md]
  })).toEqual({
    type: "root",
    children: [
      {
        type: "paragraph",
        children: [
          {
            type: "checkbox",
            children: [],
            checked: false,
            position: {
              start: {
                line: 1,
                column: 2,
                offset: 1
              },
              end: {
                line: 1,
                column: 3,
                offset: 2
              }
            }
          },
          {
            type: "text",
            value: " test",
            position: {
              start: {
                line: 1,
                column: 4,
                offset: 3
              },
              end: {
                line: 1,
                column: 9,
                offset: 8
              }
            }
          }
        ],
        position: {
          start: {
            line: 1,
            column: 1,
            offset: 0
          },
          end: {
            line: 1,
            column: 9,
            offset: 8
          }
        }
      }
    ],
    position: {
      start: {
        line: 1,
        column: 1,
        offset: 0
      },
      end: {
        line: 1,
        column: 9,
        offset: 8
      }
    }
  });

  expect(fromMarkdown('[x] test', {
    extensions: [syntax],
    mdastExtensions: [md]
  })).toEqual({
    type: "root",
    children: [
      {
        type: "paragraph",
        children: [
          {
            type: "checkbox",
            children: [],
            checked: true,
            position: {
              start: {
                line: 1,
                column: 2,
                offset: 1
              },
              end: {
                line: 1,
                column: 3,
                offset: 2
              }
            }
          },
          {
            type: "text",
            value: " test",
            position: {
              start: {
                line: 1,
                column: 4,
                offset: 3
              },
              end: {
                line: 1,
                column: 9,
                offset: 8
              }
            }
          }
        ],
        position: {
          start: {
            line: 1,
            column: 1,
            offset: 0
          },
          end: {
            line: 1,
            column: 9,
            offset: 8
          }
        }
      }
    ],
    position: {
      start: {
        line: 1,
        column: 1,
        offset: 0
      },
      end: {
        line: 1,
        column: 9,
        offset: 8
      }
    }
  });

  expect(fromMarkdown('[c] test', {
    extensions: [syntax],
    mdastExtensions: [md]
  })).toEqual({
    type: "root",
    children: [
      {
        type: "paragraph",
        children: [
          {
            type: "text",
            value: "[c] test",
            position: {
              start: {
                line: 1,
                column: 1,
                offset: 0
              },
              end: {
                line: 1,
                column: 9,
                offset: 8
              }
            }
          }
        ],
        position: {
          start: {
            line: 1,
            column: 1,
            offset: 0
          },
          end: {
            line: 1,
            column: 9,
            offset: 8
          }
        }
      }
    ],
    position: {
      start: {
        line: 1,
        column: 1,
        offset: 0
      },
      end: {
        line: 1,
        column: 9,
        offset: 8
      }
    }
  });

  expect(fromMarkdown('[ } test', {
    extensions: [syntax],
    mdastExtensions: [md]
  })).toEqual({
    type: "root",
    children: [
      {
        type: "paragraph",
        children: [
          {
            type: "text",
            value: "[ } test",
            position: {
              start: {
                line: 1,
                column: 1,
                offset: 0
              },
              end: {
                line: 1,
                column: 9,
                offset: 8
              }
            }
          }
        ],
        position: {
          start: {
            line: 1,
            column: 1,
            offset: 0
          },
          end: {
            line: 1,
            column: 9,
            offset: 8
          }
        }
      }
    ],
    position: {
      start: {
        line: 1,
        column: 1,
        offset: 0
      },
      end: {
        line: 1,
        column: 9,
        offset: 8
      }
    }
  });

  expect(fromMarkdown('[ ]test', {
    extensions: [syntax],
    mdastExtensions: [md]
  })).toEqual({
    type: "root",
    children: [
      {
        type: "paragraph",
        children: [
          {
            type: "text",
            value: "[ ]test",
            position: {
              start: {
                line: 1,
                column: 1,
                offset: 0
              },
              end: {
                line: 1,
                column: 8,
                offset: 7
              }
            }
          }
        ],
        position: {
          start: {
            line: 1,
            column: 1,
            offset: 0
          },
          end: {
            line: 1,
            column: 8,
            offset: 7
          }
        }
      }
    ],
    position: {
      start: {
        line: 1,
        column: 1,
        offset: 0
      },
      end: {
        line: 1,
        column: 8,
        offset: 7
      }
    }
  });
});