﻿namespace DashCI.Widgets.TfsBuild {
    export interface ITfsBuildData extends Models.IWidgetData {
        project?: string;
        poolInterval?: number;
        build?: number;
    }


    export class TfsBuildController implements ng.IController {
        public static $inject = ["$scope", "$q", "$timeout", "$interval", "$mdDialog", "tfsResources"];

        private data: ITfsBuildData;

        constructor(
            private $scope: Models.IWidgetScope,
            private $q: ng.IQService,
            private $timeout: ng.ITimeoutService,
            private $interval: ng.IIntervalService,
            private $mdDialog: ng.material.IDialogService,
            private tfsResources: () => Resources.Tfs.ITfsResource
        ) {
            this.data = this.$scope.data;
            this.data.id = Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
            this.data.type = Models.WidgetType.tfsBuild;
            this.data.footer = false;
            this.data.header = false;

            this.$scope.$watch(
                () => this.$scope.$element.height(),
                (height: number) => this.sizeBy(this.$scope.$element.width(), height)
            );
            this.$scope.$watch(
                () => this.$scope.$element.width(),
                (width: number) => this.sizeBy(width, this.$scope.$element.height())
            );
            this.$scope.$watch(
                () => this.data.poolInterval,
                (value: number) => this.updateInterval()
            );
            this.$scope.$on("$destroy", () => this.finalize());

            this.init();
            this.$timeout(() => this.sizeBy(this.$scope.$element.width(), this.$scope.$element.height()), 500);
        }

        private handle: ng.IPromise<any>;
        private finalize() {
            if (this.handle)
                this.$interval.cancel(this.handle);
            console.log("dispose: " + this.data.id + "-" + this.data.title);
        }


        private init() {
            this.data.title = this.data.title || "Build";
            this.data.color = this.data.color || "green";

            //default values
            this.data.poolInterval = this.data.poolInterval || 10000;

            this.updateInterval();
            this.update();
        }

        private sizeBy(width: number, height: number) {
            this.hideDetails = (width < height * 1.7);

            var icon = this.$scope.$element.find(".play-status md-icon");
            var fontSize = (Math.round(height / 1) - (this.hideDetails? 50 : 0)) + "px";
            //var lineSize = Math.round((altura) - 60) + "px";
            icon.css('font-size', fontSize);
            icon.parent().width(Math.round(height / 1));
            //p.css('line-height', lineSize);


            var header = this.$scope.$element.find(".header");
            fontSize = Math.round(height / 1) + "px";
            header.css('text-indent', fontSize);

            //var title = this.$scope.$element.find("h2");
            //fontSize = Math.round(height / 6) + "px";
            //title.css('font-size', fontSize);
            var txt = this.$scope.$element.find("h4");
            fontSize = Math.round(height / 7) + "px";
            txt.css('font-size', fontSize);

            var img = this.$scope.$element.find(".avatar");
            var size = Math.round(height - 32);
            img.width(size);
            img.height(size);

            this.hideAvatar = width < 390;
        }

        public config() {
            this.$mdDialog.show({
                controller: TfsBuildConfigController,
                controllerAs: "ctrl",
                templateUrl: 'app/widgets/tfs-build/config.html',
                parent: angular.element(document.body),
                //targetEvent: ev,
                clickOutsideToClose: true,
                fullscreen: false,
                resolve: {
                    config: () => {
                        var deferred = this.$q.defer();
                        this.$timeout(() => deferred.resolve(this.data), 1);
                        return deferred.promise;
                    }
                }
            });
            //.then((ok) => this.createWidget(type));

        }

        private updateInterval() {
            if (this.handle)
                this.$interval.cancel(this.handle);
            this.handle = this.$interval(() => this.update(), this.data.poolInterval);
        }

        public icon = "help";
        public latest: Resources.Tfs.IBuild;
        public hideDetails: boolean;
        public hideAvatar: boolean;

        private update() {
            if (!this.data.project || !this.data.build)
                return;
            var res = this.tfsResources();
            if (!res)
                return;


            console.log("start request: " + this.data.id + "; " + this.data.title);
            res.latest_build({
                project: this.data.project,
                build: this.data.build
            }).$promise.then((build: Resources.Tfs.IBuildResult) => {
                console.log("end request: " + this.data.id + "; " + this.data.title);
                var new_build: Resources.Tfs.IBuild = null;

                if (build.value.length >= 1)
                    new_build = build.value[0];

                this.latest = new_build;
                this.latest.sourceBranch = this.latest.sourceBranch.replace("refs/heads/", ""); //is it right?
                
                if (this.latest && this.latest.status) {
                    switch (this.latest.status) {
                        case "notStarted":
                        case "postponed":
                        case "none":
                            this.icon = "pause_circle_filled"; break;
                        case "inProgress":
                            this.icon = "play_circle_filled"; break;
                        case "cancelling":
                        case "stopped":
                            this.icon = "remove_circle"; break;
                        case "completed":
                            switch (this.latest.result) {
                                case "partiallySucceeded":
                                case "succeeded":
                                    this.icon = "check"; break;
                                case "failed":
                                    this.icon = "cancel"; break;
                                case "canceled":
                                    this.icon = "remove_circle"; break;
                                case "default":
                                    this.icon = "help"; break;
                            }
                            break;
                        case "default":
                            this.icon = "help"; break;
                    }

                }
                else
                    this.icon = "help";

                //var p = this.$scope.$element.find("p");

                //p.addClass('changed');
                //this.$timeout(() => p.removeClass('changed'), 1000);
                this.resizeWidget();
            }).catch((reason) => {
                this.latest = null;
                console.error(reason);
                this.resizeWidget();
            });
        }


        private resizeWidget() {
            this.$timeout(() => this.sizeBy(this.$scope.$element.width(), this.$scope.$element.height()), 500);
        }

    }

}