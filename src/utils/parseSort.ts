export const parseSort = (
    sortString: string,
): Record<string, 1 | -1> => {
    const fields = sortString.split(" ");

    const sortObject: Record<string, 1 | -1> = {};

    fields.forEach((field) => {
        if (field.startsWith("-")) {
            sortObject[field.substring(1)] = -1;
        } else {
            sortObject[field] = 1;
        }
    });

    return sortObject;
};