from rest_framework import status
from rest_framework.response import Response

class BulkCreateMixin:
    """
    A mixin that adds support for POSTing either a single object or
    a list of objects to a DRF ViewSet. It also injects the current
    user into a configurable field (e.g. 'created_by', 'submitted_by').
    """

    user_field = "created_by"

    def create(self, request, *args, **kwargs):
        data = request.data
        many = isinstance(data, list)

        serializer = self.get_serializer(data=data, many=many)
        serializer.is_valid(raise_exception=True)

        if many:
            # Pass user_field for each object at save-time
            instances = serializer.save(**{self.user_field: request.user})
        else:
            instances = serializer.save(**{self.user_field: request.user})

        output_serializer = self.get_serializer(instances, many=many)
        return Response(output_serializer.data, status=status.HTTP_201_CREATED)