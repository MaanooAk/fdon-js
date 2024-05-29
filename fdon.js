/**
 * fdon.js v1
 * 
 * author: Akritas Akritidis
 */
(() => {

    const whitespace = "=, \t\r\n"
    const special = "{}[]():'\""
    const whitespace_special = whitespace + special

    const STRING = "string", NUMBER = "number"
    const S = " ", Q = "'", D = '"', N = "\n", H = "#"

    const REGEX_quick_string = /^[^=, \t\r\n{}\[\]():'"0-9]*$/

    // parse

    function tokens_of(text) {
        const tokens = []
        for (let i = 0; i < text.length; i++) {
            if (whitespace.includes(text[i])) {
                // nop
            } else if (text[i] == H) {
                while (text[i] != N) i++
            } else if (text[i] == Q || text[i] == D) {
                let e = i + 1
                while (!(text[e] == text[i] && text[e - 1] != "\\")) e++
                tokens.push(D + text.substring(i + 1, e) + D)
                i = e
            } else if (special.includes(text[i])) {
                tokens.push(text[i])
            } else {
                let e = i + 1
                while (!whitespace_special.includes(text[e])) e++
                tokens.push(text.substring(i, e))
                i = e - 1
            }
        }
        return tokens
    }

    class Tokens {
        constructor(text) {
            this.tokens = tokens_of(text)
            this.index = 0
        }
        next() {
            return this.tokens[this.index++]
        }
        accept(x) {
            if (this.tokens[this.index] !== x) return false
            this.index++
            return true

        }
    }

    function parse(text, reviver) {
        if (reviver) throw new Error("reviver not supported")

        const tokens = new Tokens(text)
        return parse_value(tokens)
    }

    function parse_value(tokens) {
        if (tokens.accept("{")) return parse_object(tokens)
        if (tokens.accept("[")) return parse_array(tokens)
        return parse_literal(tokens)
    }

    function parse_object(tokens) {
        const object = {}
        while (!tokens.accept("}")) {
            const key = parse_literal(tokens)
            tokens.accept(":")
            const value = parse_value(tokens)
            object[key] = value
        }
        return object
    }

    function parse_array(tokens) {
        const array = []
        while (!tokens.accept("]")) {
            array.push(parse_value(tokens))
        }
        return array
    }

    function parse_literal(tokens) {
        const t = tokens.next()
        if (t[0] == "'") return t.substring(1, t.length - 1).replace(/\'/g, "'")
        if (t[0] == '"') return t.substring(1, t.length - 1).replace(/\"/g, '"')
        if (t.match(REGEX_quick_string)) return t
        return JSON.parse(t)
    }

    // stringify

    class Writer {
        constructor(space) {
            this.space = space
            this.parts = []
            this.ind = 0
        }
        line(ind) {
            this.ind += ind ?? 0
            if (ind < 0) this.parts.pop() // remove the last line
            this.parts.push(this.space ? (N + this.space.repeat(this.ind)) : " ")
            return this
        }
        append(x) {
            this.parts.push(x)
            return this
        }
        string() {
            return this.parts.join("")
        }
    }

    function stringify(value, replacer, space) {
        if (replacer) throw new Error("replacer not supported")

        space ??= ""
        if (typeof space == NUMBER) space = " ".repeat(space)

        if (typeof value === STRING) {
            if (value.match(REGEX_quick_string)) return value
            return Q + value.replace(Q, "\'") + Q
        }
        if (typeof value !== "object") return JSON.stringify(value)

        const writer = new Writer(space)
        stringify_value(value, writer)
        return writer.string()
    }

    function stringify_value(value, writer) {
        if (typeof value === "object") {
            if (Array.isArray(value)) return stringify_array(value, writer)
            else return stringify_object(value, writer)
        }
        // literal
        if (typeof value === STRING && value.match(REGEX_quick_string)) return writer.append(value)
        return writer.append(JSON.stringify(value))
    }
    function stringify_object(value, writer) {
        writer.append("{").line(1)
        for (const i in value) {
            writer.append(i).append(S)
            stringify_value(value[i], writer)
            writer.line()
        }
        writer.line(-1).append("}")
    }
    function stringify_array(value, writer) {
        writer.append("[").line(1)
        for (const i of value) {
            stringify_value(i, writer)
            writer.line()
        }
        writer.line(-1).append("]")
    }

    window.FDON = {
        parse, stringify
    }
})()