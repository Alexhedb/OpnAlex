/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2022, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
import DuplicateTask from './DuplicateTask';

export default class DuplicateAction {
    constructor(openmct) {
        this.name = 'Duplicate';
        this.key = 'duplicate';
        this.description = 'Duplicate this object.';
        this.cssClass = "icon-duplicate";
        this.group = "action";
        this.priority = 7;

        this.openmct = openmct;
    }

    invoke(objectPath) {
        this.object = objectPath[0];
        this.parent = objectPath[1];

        this.showForm(this.object, this.parent);
    }

    inNavigationPath() {
        return this.openmct.router.path
            .some(objectInPath => this.openmct.objects.areIdsEqual(objectInPath.identifier, this.object.identifier));
    }

    onSave(changes) {
        let inNavigationPath = this.inNavigationPath();
        if (inNavigationPath && this.openmct.editor.isEditing()) {
            this.openmct.editor.save();
        }

        let duplicationTask = new DuplicateTask(this.openmct);
        if (changes.name && (changes.name !== this.object.name)) {
            duplicationTask.changeName(changes.name);
        }

        const parentDomainObjectpath = changes.location || [this.parent];
        const parent = parentDomainObjectpath[0];

        return duplicationTask.duplicate(this.object, parent);
    }

    showForm(domainObject, parentDomainObject) {
        const formStructure = {
            title: "Duplicate Item",
            sections: [
                {
                    rows: [
                        {
                            key: "name",
                            control: "textfield",
                            name: "Title",
                            pattern: "\\S+",
                            required: true,
                            cssClass: "l-input-lg",
                            value: domainObject.name
                        },
                        {
                            name: "Location",
                            cssClass: "grows",
                            control: "locator",
                            required: true,
                            parent: parentDomainObject,
                            validate: this.validate(parentDomainObject),
                            key: 'location'
                        }
                    ]
                }
            ]
        };

        this.openmct.forms.showForm(formStructure)
            .then(this.onSave.bind(this));
    }

    validate(currentParent) {
        return (data) => {
            const parentCandidatePath = data.value;
            const parentCandidate = parentCandidatePath[0];

            let currentParentKeystring = this.openmct.objects.makeKeyString(currentParent.identifier);
            let parentCandidateKeystring = this.openmct.objects.makeKeyString(parentCandidate.identifier);
            let objectKeystring = this.openmct.objects.makeKeyString(this.object.identifier);

            if (!parentCandidateKeystring || !currentParentKeystring) {
                return false;
            }

            if (parentCandidateKeystring === objectKeystring) {
                return false;
            }

            const parentCandidateComposition = parentCandidate.composition;
            if (parentCandidateComposition && parentCandidateComposition.indexOf(objectKeystring) !== -1) {
                return false;
            }

            return parentCandidate && this.openmct.composition.checkPolicy(parentCandidate, this.object);
        };
    }

    appliesTo(objectPath) {
        let parent = objectPath[1];
        let parentType = parent && this.openmct.types.get(parent.type);
        let child = objectPath[0];
        let childType = child && this.openmct.types.get(child.type);
        let locked = child.locked ? child.locked : parent && parent.locked;

        if (locked) {
            return false;
        }

        return childType
            && childType.definition.creatable
            && parentType
            && parentType.definition.creatable
            && Array.isArray(parent.composition);
    }
}
