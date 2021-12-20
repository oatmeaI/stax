# Stax: A Widget Library for Scriptable

Stax is a (very thin) abstraction over Scriptable's built-in widget API. It aims to provide a more declarative API, and allows you to create reusable components.

## Example

Scriptable API (assume `font`, `mainImage`, etc, are defined above):

```js
const widget = new ListWidget();

const mainStack = widget.addStack();
mainStack.layoutVertically();
mainStack.spacing = 2;

const titleStack = mainStack.addStack();
titleStack.layoutHorizontally();
titleStack.addSpacer();
const text = titleStack.addText("A Really Cool Widget!");
titleStack.addSpacer();
line.font = font;
line.textColor = fontColor;
line.centerAlignText();

const imageStack = mainStack.addStack();
imageStack.layoutVertically();
const image = imageStack.addImage(mainImage);
image.centerAlignImage();

Script.setWidget(widget);
Script.complete();
```

Here's the same widget written with Stax:

```js
const { Widget, HorizontalStack, VerticalStack, Spacer, Text, Picture } = importModule("Stax");

const title = HorizontalStack({}, [
    Spacer(),
    Text("A Really Cool Widget!", { font: font, color: fontColor, align: "center" }),
    Spacer(),
]);

const content = VerticalStack({}, [Picture(mainImage, { align: "center" })]);

const widget = new Widget({ bgType: "gradient", bgGradient: gradient, spacing: 2 }, [
    VerticalStack({}, [title, content]),
]);

widget.render();
Script.complete();
```

## Installation

Add `Stax.js` to your Scriptable library, and then just import what you need:

```js
const { Widget, HorizontalStack, Picture } = importModule("Stax");
```

## Usage

## API

Stax exposes a number of constructors for various types of Widget elements. In general, the arguments for containers (Stacks, Widgets) are `(params, children)`, while for content elements (Text, Picture, etc) it's `(content, params)`. Generally, all keys in `params` are optional, unless otherwise specified.

| Function | Notes |
| `Widget({bgType: 'gradient', bgGradient: new LinearGradient(), spacing: 2}, [...children])` | Currently only gradient backgrounds are supported. If `bgType` is `"gradient"`, `bgGradient` must be present and must be a Scriptable `LinearGradient` object. `Widget.render()` will render the entire content tree, and call `Script.setWidget` with itself as an argument. |
| `Stack({layout: "horizontal" | "vertical", align: "top" | "center" | "bottom", spacing: 2}, [...children])` | Creates a Scriptable `Stack` object. |
| `HorizontalStack({align: "top" | "center" | "bottom", spacing: 2}, [...children])` | This is just shorthand for `Stack({layout: "horizontal", ...params}, [...children]`, to make layouts a little easier to read. |
| `VerticalStack({align: "top" | "center" | "bottom", spacing: 2}, [...children])` | This is just shorthand for `Stack({layout: "vertical", ...params}, [...children]`, to make layouts a little easier to read. |
| `Spacer({size: 2 | null})` | Creates a `Spacer` object. `{size: null}` will let the Spacer flex to fill the available space; you can also pass a number to set an absolute value. `Spacer()` is shorthand for `Spacer({size: null})` |
| `Text(content, { font: new Font(), color: new Color(), align: "left" | "center" | "right" })` | Creates a line of text with `content`. If present, `font` must be a Scriptable `Font` object. Likewise, if present, `color` must be a Scriptable `Color` object. |
| `Picture(content, { align: "left" | "center" | "right", mode: "fit" | "fill" })` | Creates a picture with `content`. |

One nice thing about the thinness of Stax, is that it's not hard to reach in to the Scriptable API if you need to for some reason. All Stax components have an `element` property that references the underlying Scriptable object:

```js
const title = Text("This is a title", {});
title.createElement(); // Note that you must call this method first; usually the underlying objects are not created until the final call to `render()` on the Widget.
title.element.textOpacity = 0.5;
```

This is mostly useful for access properties that haven't been implemented by Stax yet, like above.

Stax exposes a single class, `Component` that can be used to create your own reusable components, like so:

```js
class Title extends Component {
    constructor(content, params) {
        super(params);
    }

    render() {
        const { font } = this.params;

        return HorizontalStack({}, [Spacer({ size: 5 }), Text(this.content, { font })]);
    }
}

const title = new Title("This is a title", { font: new Font() });
```

Stax also exposes a single utility function, `wrapComponent` which can be used to allow you to omit the `new` keyword on custom components:

```js
const Title = wrapComponent(
    class TitleComponent extends Component {
        constructor(content, params) {
            super(params);
        }

        render() {
            const { font } = this.params;

            return HorizontalStack({}, [Spacer({ size: 5 }), Text(this.content, { font })]);
        }
    }
);

const title = Title("This is a title", { font: new Font() });
```

That's it! The library is under "active" development, in that I add features as I encounter a need for them :sweat-smile: - so as you'll notice, there is plenty of the built in widget API that is not implemented yet. (This project was originally started at around 2am while I was working on a custom widget and was wishing there was a cleaner way to lay them out).

Feel free to add stuff and submit PRs!
