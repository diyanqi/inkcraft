// .pnpmfile.cjs

function readPackage(pkg, context) {
    if (pkg.name === 'mdast-util-gfm') {
        pkg.dependencies = {
            ...pkg.dependencies,
            'mdast-util-gfm-autolink-literal': '2.0.0',
        };
        context.log('mdast-util-gfm -> mdast-util-gfm-autolink-literal@2.0.0');
    }

    return pkg;
}

module.exports = {
    hooks: {
        readPackage,
    },
};