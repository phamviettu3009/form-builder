import type { FormPlugin, PluginDefinitions } from "./types";

type PluginType = keyof PluginDefinitions;
type PluginStores = {
  [Type in PluginType]: Map<string, FormPlugin<PluginDefinitions[Type]>>;
};

class PluginRegistry {
  private plugins: PluginStores = {
    validation: new Map(),
    component: new Map(),
    form: new Map(),
  };

  register<Type extends PluginType>(
    type: Type,
    plugin: FormPlugin<PluginDefinitions[Type]>,
  ): void {
    this.plugins[type].set(plugin.name, plugin);
  }

  getPluginByName<Type extends PluginType>(
    name: string,
    type: Type,
  ): FormPlugin<PluginDefinitions[Type]> {
    const plugin = this.plugins[type].get(name);
    if (!plugin) {
      throw new Error(`Plugin not found: ${name}`);
    }
    return plugin;
  }

  getAllPlugins<Type extends PluginType>(
    type: Type,
  ): FormPlugin<PluginDefinitions[Type]>[] {
    return Array.from(this.plugins[type].values());
  }
}

export const pluginRegistry = new PluginRegistry();
