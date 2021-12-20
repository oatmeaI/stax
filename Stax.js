// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: deep-green; icon-glyph: laptop-code;
class UIElement {
    constructor(content, params) {
        this.content = content;
        this.children = [];
        this.config = params;
        this.parent = null;
        this.element = null;
        if (params && params.children) this.addContent(...params.children);
    }

    configure() {}

    addContent(...children) {
        children.forEach((child) => (child.parent = this));
        this.children = [...this.children, ...children];
    }

    createElement() {
        if (this.element) return this.element;
        throw new Error("createElement not defined for this Component.");
    }

    render() {
        this.element = this.createElement();
        this.children.forEach((child) => child.render());
        this.configure();
    }
}

class Component extends UIElement {
    createElement() {
        const element = this.render();
        this.parent.addContent(element);
        element.render();
    }
}

class Widget extends UIElement {
    constructor(params, children) {
        super(null, { ...params, children });
    }

    configure() {
        if (this.config.bgType === "gradient") this.element.backgroundGradient = this.config.bgGradient;
        this.element.spacing = this.config.spacing || 0;
        Script.setWidget(this.element);
    }

    createElement() {
        return this.element || new ListWidget();
    }
}

class Stack extends UIElement {
    constructor(params = { layout: "horizontal", align: "center", spacing: 4 }, children) {
        super(null, { ...params, children });
    }

    setAlignment() {
        const { align } = this.config;
        switch (align) {
            case "center":
                this.element.centerAlignContent();
                break;
            case "top":
                this.element.topAlignContent();
                break;
            case "bottom":
                this.element.bottomAlignContent();
                break;
            default:
                break;
        }
    }

    setLayout() {
        const { layout } = this.config;
        const fnMap = {
            vertical: this.element.layoutVertically,
            horizontal: this.element.layoutHorizontally,
        };

        fnMap[layout] && fnMap[layout]();
    }

    configure() {
        this.setAlignment();
        this.setLayout();
        this.element.spacing = this.config.spacing || 0;
    }

    createElement() {
        this.element = this.parent.element.addStack();
        return this.element;
    }
}

class Spacer extends UIElement {
    constructor(params = { size: null }) {
        super(null, params);
    }

    createElement() {
        return this.element || this.parent.element.addSpacer(this.config.size);
    }
}

class Text extends UIElement {
    constructor(content, params = { font: null, color: null, align: null }) {
        super(content, params);
    }

    configure() {
        const { font, color, align } = this.config;

        if (font) this.element.font = font;
        if (color) this.element.textColor = color;
        if (align) this.element[`${align}AlignText`]();
    }

    createElement() {
        return this.element || this.parent.element.addText(this.content);
    }
}

class Picture extends UIElement {
    constructor(content, params = { align: null, mode: null }) {
        super(content, params);
    }

    configure() {
        switch (this.config.align) {
            case "left":
                this.element.leftAlignImage();
                break;
            case "center":
                this.element.centerAlignImage();
                break;
            case "right":
                this.element.rightAlignImage();
                break;
            default:
                break;
        }

        switch (this.config.mode) {
            case "fill":
                this.element.applyFillingContentMode();
                break;
            case "fit":
                this.element.applyFittingContentMode;
                break;
            default:
                break;
        }
    }

    createElement() {
        return this.element || this.parent.element.addImage(this.content);
    }
}

class HorizontalStack extends Stack {
    setLayout() {
        this.element.layoutHorizontally();
    }
}

class VerticalStack extends Stack {
    setLayout() {
        this.element.layoutVertically();
    }
}

const wrapComponent =
    (classType) =>
    (...args) =>
        new classType(...args);

module.exports = {
    Widget: wrapComponent(Widget),
    Stack: wrapComponent(Stack),
    Text: wrapComponent(Text),
    Spacer: wrapComponent(Spacer),
    VerticalStack: wrapComponent(VerticalStack),
    HorizontalStack: wrapComponent(HorizontalStack),
    Picture: wrapComponent(Picture),
    Component,
    wrapComponent,
};
