# Data Visualization

An [Omeka S](https://omeka.org/s/) module for visualizing your data.

# Important Info

For loading and configuring any module, Laminas provides a **ModuleManager**. This ModuleManager looks for Module class in the module namespace (Datavis in our case). For this case, ModuleManager will need a class Datavis/Module. This class is defined inside the **Module.php** file. Inside this class, the ModuleManager looks for **getConfig()** method and calls it automatically. So, it seems the getConfig() is the starting method for us to look into.

Next, the getConfig() method loads a file **config/module.config.php**.

Next, the config information provided in the **config/module.config.php** file is passed to the relevant components by the **ServiceManager**. Thus, if we look inside this file, we have sections for various components. For example, **controllers** and **view_manager**. The **controller** section provides the list of all the controllers provided by the module. The controller can be referenced fully by qualified class name, and the laminas-servicemanager **InvokableFactory** can be used to create instances of it.

Next, let's discuss **view_manager** section. In this section, the view directory is added to the **TemplatePathStack** configuration. This allows it to find the view scripts for the Module stored inside the view/ directory.

With this wee next move to the main application's (not included here, but it is in the Omeka S) config/modules.config.php file. In this file, we need to add the module (Datavis) so that the application knows of its existence.

Next, let's understand organization of the pages that the Laminas expects. Remeber, each page of the application is known as an **action**. Actions are then grouped into **controllers** within modules. Therefore, related actions are generally grouped into one controller. Based on the requirement of your application, plan about the pages (actions) that could exist, and based on their relationsips, organize them into various or single controller(s). In the case of Datavis, for admin and general, there are two separate folders and each contains a single controller.

Next, understanding the **routes**. The routes help in mapping of a URL to a particular action. The routes are also defined in the **module.config.php** file. For example, lets say we have a homepage (action) index, this becomes one of the member of the routes array inside the router array in the config file. The index action has various array properties (keys). Eg. 'type' defines its route type, and we could use Segment::class for it. The segment route allows for specifying placeholders in the URL pattern (route) that will be mapped to named parameters in the matched route. So, inside the 'options' key for the action, we can define 'route' key to be 'index/[/:action[/:id]]'. Remember here, index is our action. With this definition of 'route' key, it matches any URL starting with '/index'. Also, we have placed action and id inside the square bracket, meaning these are optional for our actions. Also, inside the 'options' key, we can define 'constraints' for these actions which could be used with the 'action' key which can be used to define the possible names for the actions inside the /index page. And, also 'id' key, which can be used to give the ids of the items that the action inside the index action can work on. Using regex, we can limit the actions to be only alphanumeric, and ids to be numeric.

Next, we look into building a controller. We define files inside Controller folder to define each controller. The files are named such that for example, IndexController.php refers to the controller by name 'Index'. The name of the controller must start with capital letter. Now, every action is defined as a public method within the Controller class. For example, the index action is named indexAction(), and it starts with lower case letter. Thus, after creating the methods inside the controller(s), on navigating to the correct URL, the respective method will be called.

Once Controllers are set up with actions, our next targets should be to setup the views and the models. The views are integrated to the application by creating view scripts, and these scripts will be executed by the **defaultViewStrategy**. Remember here that any variables or view models that were returned from the controller action method will be passed to the view during the execution of the strategy.

## Extra Info not related to module but to the main Omeaka-S:

Although Laminas does have autoloading capabilities, the recommended method is to use composer's autoloading. So, the namespae has to be informed to the composer, along with the information on where the namespace's file exist. This is done in composer.json file in the project root inside autoload section.
