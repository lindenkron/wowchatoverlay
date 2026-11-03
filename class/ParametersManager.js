class ParameterManager {
    constructor() {
        this.parameters = {};
    };

    load(url) {
        this.parameters = Object.fromEntries(
            new URL(url).searchParams.entries()
        );
    };

    get(key) {
        return this.parameters[key];
    };
};

export const parameters = new ParameterManager();