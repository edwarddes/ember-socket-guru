module.exports = {
  normalizeEntityName() {},

  afterInstall() {
    const requiredBowerPackages = [
      ['pusher', 'Pusher', '3.1.0'],
      ['pusher-test-stub', 'Pusher Test Stub (required for pusher)', '1.0.0'],
      ['action-cable', 'ActionCable', '^5.0.0'],
    ];

    return requiredBowerPackages.reduce((promise, pkg) => {
      return promise.then(() => {
        const [name, displayName, version] = pkg;
        /* eslint-disable netguru-ember/named-functions-in-promises */
        return this.ui.prompt({
          type: 'input',
          name: 'library',
          message: `Do you want to install ${displayName} library through bower? [Y/n]`,
        }).then((data) => {
          if (data.library === 'Y') {
            console.log(name, version);
            return this.addBowerPackageToProject(name, version);
          }
        });
        /* eslint-enable */
      });
    }, new Promise((resolve) => resolve(true)));
  },
};
