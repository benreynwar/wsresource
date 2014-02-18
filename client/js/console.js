define(
  [],
  function() {
    if (console === undefined) {
      console = {log: function() {}};
    }
    return console
  });

