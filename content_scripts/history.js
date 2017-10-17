const History = {
    goBack(repeats) {
        history.go(-repeats);
    },
    goForward(repeats) {
        history.go(repeats);
    },
};
